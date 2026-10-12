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
type PackageOwner = { root: string; manifest: Manifest }

export const SHARED_RUNTIME = ["react", "react-dom", "react-router"]

export function importedPackageName(id: string): string | undefined {
  if (/^(?:[./#\0]|[\w-]+:)/u.test(id)) return undefined
  return id
    .split("/")
    .slice(0, id.startsWith("@") ? 2 : 1)
    .join("/")
}

/** Check each resolved import against local installations without walking the dependency graph. */
export class ProjectPackages {
  readonly root: string
  private readonly project: PackageOwner
  private readonly manifests = new Map<string, Manifest>()
  private readonly resolvedPackages = new Set<string>()
  private readonly frameworkRoot: string

  constructor(root: string) {
    this.root = realpathSync(root)
    this.project = this.owner(this.root)
    this.frameworkRoot = canonicalPath(path.join(this.root, "node_modules/ardo"))
  }

  checkImport(id: string, importer: string | undefined): boolean {
    const name = importedPackageName(id)
    if (name == null) return true
    const owner = this.ownerOf(importer) ?? this.project
    if (name === owner.manifest.name) return true
    if (!dependencyNames(owner, this.root).includes(name)) {
      throw new Error(
        `[ardo] Undeclared dependency "${name}" in ${owner.root}. Add it to that package's package.json; ancestor dependencies are not inherited.`
      )
    }
    if (this.installedPackage(owner, name) != null) return true
    if (owner.root !== this.root && isOptional(owner.manifest, name)) return false
    throw new Error(
      `[ardo] Dependency "${name}" is not installed in ${owner.root}/node_modules. Install it in the documentation project; Ardo will not search ancestor node_modules.`
    )
  }

  checkFile(id: string, importer?: string): void {
    const cleanId = id.split("?", 1)[0]
    const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
    if (!path.isAbsolute(file)) return
    const canonical = canonicalPath(file)
    const target = this.ownerOf(canonical)
    const origin = this.ownerOf(importer) ?? this.project
    if (target?.root === this.root) return
    if (
      target != null &&
      (target.root === origin.root || (importer == null && this.resolvedPackages.has(target.root)))
    )
      return
    if (
      target != null &&
      dependencyNames(origin, this.root).some((name) => {
        const installed = this.installedPackage(origin, name)
        return installed != null && canonicalPath(installed) === target.root
      })
    ) {
      this.resolvedPackages.add(target.root)
      return
    }
    if (target != null && origin.root === this.root) {
      throw new Error(
        `[ardo] Undeclared application dependency "${target.manifest.name}". Declare and install it in the docs package instead of importing a transitive or ancestor package by path or alias.`
      )
    }
    throw new Error(
      `[ardo] Import outside the documentation package: ${file}. Keep component source inside ${this.root}, or install a packaged dependency there.`
    )
  }

  private ownerOf(id: string | undefined): PackageOwner | undefined {
    if (id == null || !path.isAbsolute(id)) return undefined
    const file = canonicalPath(id.split("?", 1)[0])
    const marker = `${path.sep}node_modules${path.sep}`
    const index = file.lastIndexOf(marker)
    if (index !== -1) {
      const name = importedPackageName(
        file
          .slice(index + marker.length)
          .split(path.sep)
          .join("/")
      )
      if (name != null) return this.owner(path.join(file.slice(0, index), "node_modules", name))
    }
    if (isPathInsideDirectory(file, this.root)) return this.project
    // Only Ardo's published files may cross a workspace source boundary.
    if (isPathInsideDirectory(file, path.join(this.frameworkRoot, "dist"))) {
      return this.owner(this.frameworkRoot)
    }
    return undefined
  }

  private owner(root: string): PackageOwner {
    let manifest = this.manifests.get(root)
    if (manifest == null) {
      const parsed: unknown = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
      if (parsed == null || typeof parsed !== "object")
        throw new Error(`[ardo] Invalid package manifest: ${root}`)
      manifest = parsed
      this.manifests.set(root, manifest)
    }
    return { root, manifest }
  }

  private installedPackage(owner: PackageOwner, name: string): string | undefined {
    const local = path.join(this.root, "node_modules", name)
    const candidates = [path.join(owner.root, "node_modules", name)]
    if (owner.root !== this.root) {
      const marker = `${path.sep}node_modules${path.sep}`
      const index = owner.root.lastIndexOf(marker)
      if (index !== -1) candidates.push(path.join(owner.root.slice(0, index), "node_modules", name))
      candidates.push(local)
    }
    // Shared runtimes must match Vite's dedupe setting and the prerender host.
    if (SHARED_RUNTIME.includes(name)) candidates.unshift(local)
    return candidates.find((candidate) => existsSync(path.join(candidate, "package.json")))
  }
}

function dependencyNames(owner: PackageOwner, projectRoot: string): string[] {
  return Object.keys({
    ...owner.manifest.dependencies,
    ...owner.manifest.peerDependencies,
    ...owner.manifest.optionalDependencies,
    ...(owner.root === projectRoot ? owner.manifest.devDependencies : {}),
  })
}

function isOptional(manifest: Manifest, name: string): boolean {
  return (
    manifest.optionalDependencies?.[name] != null ||
    manifest.peerDependenciesMeta?.[name]?.optional === true
  )
}

function canonicalPath(file: string): string {
  if (existsSync(file)) return realpathSync(file)
  const parent = path.dirname(file)
  return parent === file ? file : path.join(canonicalPath(parent), path.basename(file))
}
