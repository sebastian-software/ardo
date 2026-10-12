import { existsSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { isPathInsideDirectory } from "./path-utils"

type Manifest = {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

type PackageOwner = {
  root: string
  manifest: Manifest
  dependencies: Set<string>
}

export const SHARED_RUNTIME = ["react", "react-dom", "react-router"]

export function importedPackageName(id: string): string | undefined {
  if (/^(?:[./#\0]|[\w-]+:)/u.test(id)) return undefined
  const parts = id.split("/")
  if (id.startsWith("@")) return parts.slice(0, 2).join("/")
  return parts[0]
}

/** Own the docs package's installed dependency tree without ancestor fallback. */
export class ProjectPackages {
  readonly root: string
  private readonly project: PackageOwner
  private readonly packages = new Map<string, PackageOwner>()
  private readonly directPackages = new Set<string>()
  private readonly owners: PackageOwner[] = []

  constructor(root: string) {
    this.root = realpathSync(root)
    const manifest = readManifest(this.root)
    this.project = {
      root: this.root,
      manifest,
      dependencies: dependencyNames(manifest, true),
    }
    this.collectPackages()
    this.owners = [...this.packages.values()].sort(
      (left, right) => right.root.length - left.root.length
    )
  }

  checkImport(id: string, importer: string | undefined): boolean {
    const name = importedPackageName(id)
    if (name == null) return true
    const owner = this.ownerOf(importer) ?? this.project
    if (name !== owner.manifest.name && !owner.dependencies.has(name)) {
      throw new Error(
        `[ardo] Undeclared dependency "${name}" in ${owner.root}. Add it to that package's package.json; ancestor dependencies are not inherited.`
      )
    }
    if (name !== owner.manifest.name && this.installedPackage(owner, name) == null) {
      if (owner !== this.project && isOptional(owner.manifest, name)) return false
      throw new Error(
        `[ardo] Dependency "${name}" is not installed for ${owner.root}. Install it in the documentation project; Ardo will not search ancestor node_modules.`
      )
    }
    return true
  }

  checkFile(id: string, importer?: string): void {
    const cleanId = id.split("?", 1)[0]
    const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
    if (!path.isAbsolute(file)) return
    const canonical = canonicalPath(file)
    const owner = this.ownerOf(canonical)
    if (importer != null) this.checkDirectPackage(owner, importer)
    if (isPathInsideDirectory(canonical, this.root)) return
    if (owner != null && this.isPackageFile(canonical, owner)) return
    throw new Error(
      `[ardo] Import outside the documentation package: ${file}. Keep component source inside ${this.root}, or install a packaged dependency there.`
    )
  }

  private ownerOf(id: string | undefined): PackageOwner | undefined {
    if (id == null || !path.isAbsolute(id)) return undefined
    const file = canonicalPath(id.split("?", 1)[0])
    const owner = this.owners.find((entry) => isPathInsideDirectory(file, entry.root))
    if (owner != null) return owner
    if (isPathInsideDirectory(file, this.root)) return this.project
    return undefined
  }

  private checkDirectPackage(owner: PackageOwner | undefined, importer: string): void {
    if (owner == null || owner === this.project || this.directPackages.has(owner.root)) return
    if ((this.ownerOf(importer) ?? this.project) !== this.project) return
    throw new Error(
      `[ardo] Undeclared application dependency "${owner.manifest.name}". Add it to the documentation package's package.json instead of importing a transitive or ancestor package by path or alias.`
    )
  }

  private isPackageFile(file: string, owner: PackageOwner): boolean {
    if (
      owner.manifest.name !== "ardo" ||
      owner.root.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      return true
    }
    // Ardo's own workspace link is needed when developing the framework. Only
    // its published dist files belong to the consumer's application graph.
    return isPathInsideDirectory(file, path.join(owner.root, "dist"))
  }

  private installedPackage(owner: PackageOwner, name: string): string | undefined {
    const candidates = [path.join(owner.root, "node_modules", name)]
    if (owner !== this.project) {
      let parent = path.dirname(owner.root)
      while (parent !== path.dirname(parent)) {
        if (path.basename(parent) === "node_modules") {
          candidates.push(path.join(parent, name))
          break
        }
        parent = path.dirname(parent)
      }
      candidates.push(path.join(this.root, "node_modules", name))
    }
    return candidates.find((candidate) => existsSync(path.join(candidate, "package.json")))
  }

  private collectPackages(): void {
    const pending = [this.project]
    for (const owner of pending) {
      for (const name of owner.dependencies) {
        const dependency = this.readInstalledPackage(owner, name)
        if (dependency != null) pending.push(dependency)
      }
    }
  }

  private readInstalledPackage(owner: PackageOwner, name: string): PackageOwner | undefined {
    const installed = this.installedPackage(owner, name)
    if (installed == null) {
      this.checkMissingInstallation(owner, name)
      return undefined
    }
    const packageRoot = realpathSync(installed)
    if (owner === this.project) this.directPackages.add(packageRoot)
    if (this.packages.has(packageRoot)) return undefined
    if (
      name !== "ardo" &&
      !isPathInsideDirectory(packageRoot, this.root) &&
      !packageRoot.includes(`${path.sep}node_modules${path.sep}`)
    ) {
      throw new Error(
        `[ardo] Dependency "${name}" links to workspace source outside the documentation package: ${packageRoot}. Keep components in the docs project or install a published package.`
      )
    }
    const manifest = readManifest(packageRoot)
    const dependency = { root: packageRoot, manifest, dependencies: dependencyNames(manifest) }
    this.packages.set(packageRoot, dependency)
    return dependency
  }

  private checkMissingInstallation(owner: PackageOwner, name: string): void {
    if (owner === this.project && !isOptional(owner.manifest, name)) {
      throw new Error(
        `[ardo] Dependency "${name}" is not installed in ${this.root}/node_modules. Install the documentation package's dependencies; ancestor installations are not used.`
      )
    }
  }
}

function dependencyNames(manifest: Manifest, includeDevelopment = false): Set<string> {
  const names = Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
    ...(includeDevelopment ? manifest.devDependencies : {}),
  })
  for (const name of names) {
    if (importedPackageName(name) !== name) throw new Error(`[ardo] Invalid package name: ${name}`)
  }
  return new Set(names)
}

function isOptional(manifest: Manifest, name: string): boolean {
  return (
    manifest.optionalDependencies?.[name] != null ||
    manifest.peerDependenciesMeta?.[name]?.optional === true
  )
}

function readManifest(directory: string): Manifest {
  const file = path.join(directory, "package.json")
  const manifest: unknown = JSON.parse(readFileSync(file, "utf8"))
  if (manifest == null || typeof manifest !== "object") {
    throw new Error(`[ardo] Invalid package manifest: ${file}`)
  }
  return manifest
}

function canonicalPath(file: string): string {
  if (existsSync(file)) return realpathSync(file)
  const parent = path.dirname(file)
  if (parent === file) return file
  return path.join(canonicalPath(parent), path.basename(file))
}
