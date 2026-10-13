import { existsSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  findArdoDependencyPackageRoot,
  findManagedRuntimePackageRoot,
  getManagedRuntimePackageName,
  getManagedRuntimePackageNames,
} from "./managed-runtime"
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
type ProjectPackagesOptions = { ardoRoot?: string; managedRuntime?: boolean }
type FileCheckOptions = { importer?: string; managedName?: string; managedSourcePath?: string }
type ManagedFileCheck = {
  canonical: string
  fileKey: string
  name: string
  sourcePath: string | undefined
}
type FileOwnershipCheck = {
  file: string
  fileKey: string
  importer: string | undefined
  origin: PackageOwner
  resolvedSourcePath: string | undefined
  target: PackageOwner | undefined
}

function importedPackageName(id: string): string | undefined {
  if (/^(?:[./#\0]|[\w-]+:)/u.test(id)) return undefined
  const specifier = id.split(/[?#]/u, 1)[0] ?? id
  return specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/")
}

/** Check each resolved import against local installations without walking the dependency graph. */
export class ProjectPackages {
  readonly root: string
  private readonly project: PackageOwner
  private readonly manifests = new Map<string, Manifest>()
  private readonly resolvedPackages = new Set<string>()
  private readonly frameworkRoot: string
  private readonly managesRuntime: boolean
  private readonly managedPackageRoots = new Map<string, string>()
  private readonly resolvedModuleSources = new Map<string, string>()

  constructor(root: string, options: ProjectPackagesOptions = {}) {
    this.root = realpathSync(root)
    this.project = this.owner(this.root)
    this.frameworkRoot = canonicalPath(
      options.ardoRoot ?? path.join(this.root, "node_modules/ardo")
    )
    this.managesRuntime = options.managedRuntime === true
  }

  checkImport(id: string, importer: string | undefined): boolean {
    const name = importedPackageName(id)
    if (name == null) return true
    const managedName = this.managesRuntime ? getManagedRuntimePackageName(id) : undefined
    if (managedName != null && this.managedRuntimePackageRoot(managedName) != null) return true
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

  checkFile(id: string, options: FileCheckOptions = {}): void {
    const { importer, managedName, managedSourcePath } = options
    const file = absoluteFilePath(id)
    if (file == null) return
    const fileKey = path.resolve(file)
    const resolvedSourcePath = managedSourcePath ?? this.resolvedModuleSources.get(fileKey)
    const canonical = canonicalPath(file)
    const target = this.ownerOf(
      resolvedSourcePath == null ? canonical : canonicalPath(resolvedSourcePath)
    )
    const origin = this.ownerOf(importer) ?? this.project

    const inferredManagedName = getManagedRuntimePackageName(target?.manifest.name ?? "")
    const managedPackageName = managedName ?? inferredManagedName
    if (managedPackageName != null && this.managesRuntime) {
      this.checkManagedRuntimeFile({
        canonical,
        fileKey,
        name: managedPackageName,
        sourcePath: resolvedSourcePath,
      })
      return
    }
    this.checkFileOwnership({ file, fileKey, importer, origin, resolvedSourcePath, target })
  }

  private checkFileOwnership({
    file,
    fileKey,
    importer,
    origin,
    resolvedSourcePath,
    target,
  }: FileOwnershipCheck): void {
    if (
      this.isFrameworkOrProjectFile({
        fileKey,
        importer,
        resolvedSourcePath,
        target,
      })
    )
      return

    if (this.isOwnedPackageFile(target, origin, importer)) {
      this.recordResolvedSource(fileKey, resolvedSourcePath)
      if (target != null) this.resolvedPackages.add(target.root)
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

  private isFrameworkOrProjectFile({
    fileKey,
    importer,
    resolvedSourcePath,
    target,
  }: Pick<FileOwnershipCheck, "fileKey" | "importer" | "resolvedSourcePath" | "target">): boolean {
    if (target != null && this.isManagedRuntimePackageRoot(target.root)) {
      this.recordResolvedSource(fileKey, resolvedSourcePath)
      this.resolvedPackages.add(target.root)
      return true
    }
    if (target?.root === this.root) {
      this.recordResolvedSource(fileKey, resolvedSourcePath)
      return true
    }
    if (importer == null && target != null && this.isDirectArdoDependency(target)) {
      this.recordResolvedSource(fileKey, resolvedSourcePath)
      this.resolvedPackages.add(target.root)
      return true
    }
    return false
  }

  private isDirectArdoDependency(target: PackageOwner): boolean {
    const name = target.manifest.name ?? ""
    return findArdoDependencyPackageRoot(this.frameworkRoot, name) === target.root
  }

  private checkManagedRuntimeFile({
    canonical,
    fileKey,
    name,
    sourcePath,
  }: ManagedFileCheck): void {
    const expectedRoot = this.managedRuntimePackageRoot(name)
    const actualSourcePath = sourcePath == null ? canonical : canonicalPath(sourcePath)
    const actualRoot = this.ownerOf(actualSourcePath)?.root
    if (expectedRoot == null || actualRoot !== expectedRoot) {
      throw new Error(
        `[ardo] Managed runtime package "${name}" resolved outside Ardo's own installation.`
      )
    }
    this.recordResolvedSource(fileKey, sourcePath ?? canonical)
    this.resolvedPackages.add(expectedRoot)
  }

  private isOwnedPackageFile(
    target: PackageOwner | undefined,
    origin: PackageOwner,
    importer: string | undefined
  ): boolean {
    if (target == null) return false
    if (
      target.root === origin.root ||
      (importer == null && this.resolvedPackages.has(target.root))
    ) {
      return true
    }
    return dependencyNames(origin, this.root).some((name) => {
      const installed = this.installedPackage(origin, name)
      return installed != null && canonicalPath(installed) === target.root
    })
  }

  private recordResolvedSource(fileKey: string, sourcePath: string | undefined): void {
    if (sourcePath != null) this.resolvedModuleSources.set(fileKey, sourcePath)
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

  private managedRuntimePackageRoot(name: string): string | undefined {
    const cached = this.managedPackageRoots.get(name)
    if (cached != null) return cached
    const root = findManagedRuntimePackageRoot(this.frameworkRoot, name)
    if (root != null) this.managedPackageRoots.set(name, root)
    return root
  }

  private isManagedRuntimePackageRoot(root: string): boolean {
    if (!this.managesRuntime) return false
    return this.managedRuntimePackageRootNames().some(
      (name) => this.managedRuntimePackageRoot(name) === root
    )
  }

  private managedRuntimePackageRootNames(): string[] {
    return [...getManagedRuntimePackageNames()]
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
    return candidates.find((candidate) => existsSync(path.join(candidate, "package.json")))
  }
}

function absoluteFilePath(id: string): string | undefined {
  const cleanId = id.split("?", 1)[0]
  const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
  return path.isAbsolute(file) ? file : undefined
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
