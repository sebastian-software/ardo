import type { Environment, OptimizedDepInfo } from "vite"

import { existsSync, readFileSync, realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const MANAGED_RUNTIME_PACKAGE_NAMES = [
  "react",
  "react-dom",
  "react-router",
  "@react-router/dev",
  "lucide-react",
  "vite",
] as const

const managedRuntimePackageSet = new Set<string>(MANAGED_RUNTIME_PACKAGE_NAMES)

type PackageManifest = { dependencies?: Record<string, string>; name?: string }

/** Packages whose runtime identity is owned by Ardo and shared by its app graph. */
export function getManagedRuntimePackageName(id: string): string | undefined {
  if (/^(?:[./#\0]|[\w-]+:)/u.test(id)) return undefined
  const specifier = id.split(/[?#]/u, 1)[0] ?? id
  const name = specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/")
  return managedRuntimePackageSet.has(name) ? name : undefined
}

export function getManagedRuntimePackageNames(): readonly string[] {
  return MANAGED_RUNTIME_PACKAGE_NAMES
}

/** Map Vite's optimized cache ID back to the source file it was built from. */
export function findOptimizedDependencySource(
  id: string,
  environment: Environment
): string | undefined {
  if (environment.mode !== "dev") return undefined
  const optimizer = environment.depsOptimizer
  if (optimizer == null) return undefined

  const optimizedId = normalizeOptimizerPath(id)
  const dependencies = [
    ...Object.values(optimizer.metadata.optimized),
    ...Object.values(optimizer.metadata.discovered),
    ...Object.values(optimizer.metadata.chunks),
  ]
  const dependency = dependencies.find((entry) =>
    isOptimizedDependencyId(entry, optimizedId, optimizer.getOptimizedDepId(entry))
  )
  if (dependency?.src == null) return undefined
  return canonicalPath(dependency.src)
}

/** Find the package root containing this Ardo module, including pnpm installs. */
export function findArdoPackageRoot(moduleUrl = import.meta.url): string {
  let directory = path.dirname(fileURLToPath(moduleUrl))
  for (;;) {
    const manifestPath = path.join(directory, "package.json")
    if (existsSync(manifestPath)) {
      const manifest = readManifest(manifestPath)
      if (manifest?.name === "ardo") return canonicalPath(directory)
    }
    const parent = path.dirname(directory)
    if (parent === directory) break
    directory = parent
  }
  throw new Error(`[ardo] Could not locate the Ardo package root from ${moduleUrl}.`)
}

/**
 * Locate only Ardo's direct installation of a managed package. For published
 * packages, pnpm stores that link beside Ardo under the same node_modules;
 * workspace source uses the package's own node_modules directory.
 */
export function findManagedRuntimePackageRoot(ardoRoot: string, name: string): string | undefined {
  if (!managedRuntimePackageSet.has(name)) return undefined

  return findArdoDependencyPackageRoot(ardoRoot, name)
}

/** Find an installed direct dependency of the Ardo package itself. */
export function findArdoDependencyPackageRoot(ardoRoot: string, name: string): string | undefined {
  const ardoManifest = readManifest(path.join(ardoRoot, "package.json"))
  if (ardoManifest?.dependencies?.[name] == null) return undefined

  const candidates = [path.join(ardoRoot, "node_modules", name)]
  const containingDirectory = path.dirname(ardoRoot)
  if (path.basename(containingDirectory) === "node_modules") {
    candidates.push(path.join(containingDirectory, name))
  }

  for (const candidate of candidates) {
    const manifestPath = path.join(candidate, "package.json")
    if (!existsSync(manifestPath)) continue
    const manifest = readManifest(manifestPath)
    if (manifest?.name !== name) {
      throw new Error(`[ardo] Invalid installation for managed package "${name}" at ${candidate}.`)
    }
    return canonicalPath(candidate)
  }
  return undefined
}

export const MANAGED_RUNTIME_RESOLUTION_KEY = "ardo:managed-runtime-resolution"
export const MANAGED_RUNTIME_SOURCE_META_KEY = "ardo:managed-runtime-source"

function readManifest(manifestPath: string): PackageManifest | undefined {
  if (!existsSync(manifestPath)) return undefined
  const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"))
  if (parsed == null || typeof parsed !== "object") return undefined
  return parsed
}

function canonicalPath(file: string): string {
  if (existsSync(file)) return realpathSync(file)
  const parent = path.dirname(file)
  return parent === file ? file : path.join(canonicalPath(parent), path.basename(file))
}

function isOptimizedDependencyId(
  entry: OptimizedDepInfo,
  id: string,
  optimizedPath: string
): boolean {
  return id === normalizeOptimizerPath(entry.file) || id === normalizeOptimizerPath(optimizedPath)
}

function normalizeOptimizerPath(id: string): string {
  const cleanId = id.split("?", 1)[0] ?? id
  return path.resolve(cleanId)
}
