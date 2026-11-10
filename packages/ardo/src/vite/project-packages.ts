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
import {
  dependencyNames,
  importedPackageName,
  isOptional,
  type Manifest,
  type PackageOwner,
} from "./project-package-manifest"

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

/** Check each resolved import against declared, locally installed package ownership. */
export class ProjectPackages {
  readonly root: string
  private readonly project: PackageOwner
  private readonly manifests = new Map<string, Manifest>()
  private readonly resolvedPackages = new Set<string>()
  private readonly frameworkRoot: string
  private readonly managesRuntime: boolean
  private readonly managedPackageRoots = new Map<string, string>()
  private readonly resolvedModuleSources = new Map<string, string>()
  private readonly canonicalPaths = new Map<string, string>()
  private readonly installedPackages = new Map<string, string>()
  private readonly workspacePackages = new Map<string, PackageOwner>()

  constructor(root: string, options: ProjectPackagesOptions = {}) {
    this.root = realpathSync(root)
    this.project = this.owner(this.root)
    this.frameworkRoot = this.canonicalPath(
      options.ardoRoot ?? path.join(this.root, "node_modules/ardo")
    )
    this.managesRuntime = options.managedRuntime === true
    this.discoverWorkspacePackages()
  }

  /** Source roots reached through the project's installed dependency graph. */
  get workspaceRoots(): string[] {
    return [...this.workspacePackages.keys()]
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
    const canonical = this.canonicalPath(file)
    const target = this.ownerOf(
      resolvedSourcePath == null ? canonical : this.canonicalPath(resolvedSourcePath)
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
      `[ardo] Import outside the documentation package: ${file}. Keep component source inside ${this.root}, or declare and locally install its package.`
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
    const actualSourcePath = sourcePath == null ? canonical : this.canonicalPath(sourcePath)
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
      return installed != null && this.canonicalPath(installed) === target.root
    })
  }

  private recordResolvedSource(fileKey: string, sourcePath: string | undefined): void {
    if (sourcePath != null) this.resolvedModuleSources.set(fileKey, sourcePath)
  }

  private ownerOf(id: string | undefined): PackageOwner | undefined {
    if (id == null || !path.isAbsolute(id)) return undefined
    const file = this.canonicalPath(id.split("?", 1)[0])
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
    // Match the most specific installed source package, never an arbitrary
    // ancestor package.json or a sibling reached only through a path alias.
    const workspace = [...this.workspacePackages.values()]
      .filter((owner) => isPathInsideDirectory(file, owner.root))
      .sort((left, right) => right.root.length - left.root.length)[0]
    if (workspace != null) return workspace
    if (isPathInsideDirectory(file, this.root)) return this.project
    // Ardo's own workspace installation still exposes only its published files.
    if (isPathInsideDirectory(file, path.join(this.frameworkRoot, "dist"))) {
      return this.owner(this.frameworkRoot)
    }
    return undefined
  }

  private discoverWorkspacePackages(): void {
    const pending = [this.project]
    const visited = new Set<string>()
    for (let owner = pending.pop(); owner != null; owner = pending.pop()) {
      if (visited.has(owner.root)) continue
      visited.add(owner.root)
      for (const name of dependencyNames(owner, this.root)) {
        if (this.managesRuntime && getManagedRuntimePackageName(name) != null) continue
        const installed = this.installedPackage(owner, name)
        if (installed == null) continue
        const root = this.canonicalPath(installed)
        // Ardo's own workspace installation still exposes only its built dist.
        if (root === this.root || root === this.frameworkRoot) continue
        const dependency = this.owner(root)
        if (!root.includes(`${path.sep}node_modules${path.sep}`)) {
          this.workspacePackages.set(root, dependency)
        }
        pending.push(dependency)
      }
    }
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
    const key = `${owner.root}\0${name}`
    const cached = this.installedPackages.get(key)
    if (cached != null) return cached
    const local = path.join(this.root, "node_modules", name)
    const candidates = [path.join(owner.root, "node_modules", name)]
    if (owner.root !== this.root && !this.workspacePackages.has(owner.root)) {
      const marker = `${path.sep}node_modules${path.sep}`
      const index = owner.root.lastIndexOf(marker)
      if (index !== -1) candidates.push(path.join(owner.root.slice(0, index), "node_modules", name))
      candidates.push(local)
    }
    const installed = candidates.find((candidate) =>
      existsSync(path.join(candidate, "package.json"))
    )
    // Only remember installed packages so a later install is still found.
    if (installed != null) this.installedPackages.set(key, installed)
    return installed
  }

  /**
   * Resolve symlinks once per path. Every resolved import is checked several
   * times, and realpath on deep pnpm layouts dominated resolve time otherwise.
   */
  private canonicalPath(file: string): string {
    const cached = this.canonicalPaths.get(file)
    if (cached != null) return cached
    if (!existsSync(file)) {
      const parent = path.dirname(file)
      return parent === file ? file : path.join(this.canonicalPath(parent), path.basename(file))
    }
    const canonical = realpathSync(file)
    this.canonicalPaths.set(file, canonical)
    return canonical
  }
}

function absoluteFilePath(id: string): string | undefined {
  const cleanId = id.split("?", 1)[0]
  const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
  return path.isAbsolute(file) ? file : undefined
}
