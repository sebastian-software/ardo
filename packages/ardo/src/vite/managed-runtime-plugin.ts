import type { Alias, AliasOptions, Plugin, UserConfig } from "vite"

import { realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  findArdoPackageRoot,
  findManagedRuntimePackageRoot,
  findOptimizedDependencySource,
  getManagedRuntimePackageName,
  getManagedRuntimePackageNames,
  MANAGED_RUNTIME_RESOLUTION_KEY,
  MANAGED_RUNTIME_SOURCE_META_KEY,
} from "./managed-runtime"
import { isPathInsideDirectory } from "./path-utils"
import { createProjectBoundaryPlugin } from "./project-boundary-plugin"

type ManagedRuntimePluginOptions = { ardoRoot?: string }
type PackageRootResolver = (name: string) => string | undefined

export function createRuntimeBoundaryPlugins(): Plugin[] {
  const ardoRoot = findArdoPackageRoot()
  return [
    createProjectBoundaryPlugin({ ardoRoot, managedRuntime: true }),
    createManagedRuntimePlugin({ ardoRoot }),
  ]
}

// Vite resolves optimizeDeps.include with resolve.alias and its own resolver
// only; plugin resolveId hooks do not run there. The nested "ardo > react" form
// makes Vite resolve the specifier from Ardo's installation with the
// environment's export conditions.
const managedBrowserIncludes = [
  "ardo > react",
  "ardo > react/jsx-runtime",
  "ardo > react/jsx-dev-runtime",
  "ardo > react-dom",
  "ardo > react-dom/client",
  "ardo > react-dom/static",
  // Vite's first optimizer scan sees the generated router entry before Ardo's
  // UI chunks. Include Ardo's direct browser graph in the same pass so those
  // later imports cannot invalidate the React entry before hydration starts.
  "ardo > @vanilla-extract/recipes/createRuntimeFn",
  "ardo > minisearch",
  "ardo > react-compare-slider/components",
  "ardo > react-compare-slider/hooks",
] as const

const browserDependencyNames = new Set([
  ...getManagedRuntimePackageNames(),
  "@vanilla-extract/recipes",
  "minisearch",
  "react-compare-slider",
])

const managedSsrIncludes = [
  "ardo > react",
  "ardo > react/jsx-runtime",
  "ardo > react/jsx-dev-runtime",
  "ardo > react-dom",
  "ardo > react-dom/server",
  "ardo > react-dom/static",
  "ardo > @vanilla-extract/recipes/createRuntimeFn",
  "ardo > minisearch",
  "ardo > react-compare-slider/components",
  "ardo > react-compare-slider/hooks",
] as const

/** Resolve framework-owned runtime imports from Ardo's package graph. */
export function createManagedRuntimePlugin(options: ManagedRuntimePluginOptions = {}): Plugin {
  const ardoRoot = options.ardoRoot ?? findArdoPackageRoot()
  const resolutionImporter = path.join(ardoRoot, "package.json")
  const packageRoots = new Map<string, string | undefined>()
  const getPackageRoot: PackageRootResolver = (name) => {
    if (!packageRoots.has(name)) {
      packageRoots.set(name, findManagedRuntimePackageRoot(ardoRoot, name))
    }
    return packageRoots.get(name)
  }
  const aliases = getManagedRuntimeAliases()
  const managedNames = new Set<string>(getManagedRuntimePackageNames())

  return {
    name: "ardo:managed-runtime",
    enforce: "pre",
    config: {
      order: "post",
      handler(config) {
        // Vite's alias plugin runs before every resolveId hook and also inside
        // the optimizer's include resolver. Claim managed specifiers before
        // caller aliases so they cannot redirect the shared runtime outside Ardo.
        const existingAliases = normalizeAliases(config.resolve?.alias)
        const otherAliases = existingAliases.filter(
          (alias) =>
            !aliases.some(
              (managedAlias) =>
                alias.find === managedAlias.find && alias.replacement === managedAlias.replacement
            )
        )
        const resolve = config.resolve ?? {}
        config.resolve = {
          ...resolve,
          alias: [...aliases, ...otherAliases],
          dedupe: resolve.dedupe?.filter((name) => !managedNames.has(name)),
        }

        // These imports are reached by Ardo's generated client entry and
        // Ardo's UI. Including them up front avoids an optimizer reload between
        // the first request for the generated entry and hydration.
        config.optimizeDeps = withManagedIncludes({
          optimizeDeps: config.optimizeDeps,
          includesToAdd: managedBrowserIncludes,
          frameworkPackageNames: browserDependencyNames,
          packagesToExclude: ["ardo"],
        })

        addManagedSsrIncludes(config, browserDependencyNames)
      },
    },
    async resolveId(id, _importer, resolveOptions) {
      const name = getManagedRuntimePackageName(id)
      if (name == null) return

      const packageRoot = getPackageRoot(name)
      if (packageRoot == null) {
        throw new Error(
          `[ardo] Managed runtime package "${name}" must be installed as a direct Ardo dependency.`
        )
      }

      const resolved = await this.resolve(id, resolutionImporter, {
        ...resolveOptions,
        skipSelf: true,
        custom: {
          ...resolveOptions.custom,
          [MANAGED_RUNTIME_RESOLUTION_KEY]: true,
        },
      })
      if (resolved == null || resolved.external === true) {
        throw new Error(
          `[ardo] Could not resolve managed runtime import "${id}" from Ardo's installation.`
        )
      }

      const resolvedPath =
        findOptimizedDependencySource(resolved.id, this.environment) ?? canonicalPath(resolved.id)
      if (resolvedPath == null || !isPathInsideDirectory(resolvedPath, packageRoot)) {
        throw new Error(
          `[ardo] Managed runtime import "${id}" resolved outside Ardo's "${name}" installation.`
        )
      }
      return {
        ...resolved,
        ...(isOptimizerScan(resolveOptions) ? { id: resolvedPath } : {}),
        meta: {
          ...resolved.meta,
          [MANAGED_RUNTIME_SOURCE_META_KEY]: { name, sourcePath: resolvedPath },
        },
      }
    },
  }
}

function addManagedSsrIncludes(config: UserConfig, managedNames: ReadonlySet<string>): void {
  const environments = config.environments ?? {}
  const ssr = environments.ssr
  const optimizeDeps = withManagedIncludes({
    optimizeDeps: ssr.optimizeDeps,
    includesToAdd: managedSsrIncludes,
    frameworkPackageNames: managedNames,
    packagesToExclude: ["ardo"],
  })
  config.environments = {
    ...environments,
    ssr: {
      ...ssr,
      // The published Ardo wrappers are ESM. Keeping them out of the optimizer
      // avoids a late reload; include their CommonJS dependencies instead.
      optimizeDeps,
    },
  }
}

function withManagedIncludes(options: {
  optimizeDeps: UserConfig["optimizeDeps"]
  includesToAdd: readonly string[]
  frameworkPackageNames: ReadonlySet<string>
  packagesToExclude: readonly string[]
}): NonNullable<UserConfig["optimizeDeps"]> {
  const { optimizeDeps, includesToAdd, frameworkPackageNames, packagesToExclude } = options
  const includes = (optimizeDeps?.include ?? []).map((id) => toManagedInclude(id))
  const excludes =
    optimizeDeps?.exclude?.filter(
      (id) => !frameworkPackageNames.has(packageNameFromOptimizerId(id))
    ) ?? []
  return {
    ...optimizeDeps,
    include: [...new Set([...includes, ...includesToAdd])],
    exclude: [...new Set([...excludes, ...packagesToExclude])],
  }
}

/** Point a caller's plain managed include at Ardo's installation as well. */
function toManagedInclude(id: string): string {
  if (id.includes(">") || getManagedRuntimePackageName(id) == null) return id
  return `ardo > ${id}`
}

function packageNameFromOptimizerId(id: string): string {
  const lastSpecifier = id.slice(id.lastIndexOf(">") + 1).trim()
  return (
    lastSpecifier
      .split("/")
      .slice(0, lastSpecifier.startsWith("@") ? 2 : 1)
      .join("/") || id
  )
}

function isOptimizerScan(options: object): boolean {
  return Reflect.get(options, "scan") === true
}

function normalizeAliases(aliases: AliasOptions | undefined): Alias[] {
  if (aliases == null) return []
  if (isAliasArray(aliases)) return [...aliases]
  return Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }))
}

function isAliasArray(aliases: AliasOptions): aliases is readonly Alias[] {
  return Array.isArray(aliases)
}

function getManagedRuntimeAliases(): Alias[] {
  // An identity alias changes nothing itself. Vite applies the first matching
  // alias only, so listing these first keeps caller aliases away from managed
  // specifiers and leaves the import to the resolveId hook above.
  return getManagedRuntimePackageNames().map((name) => ({ find: name, replacement: name }))
}

function canonicalPath(id: string): string | undefined {
  const cleanId = id.split("?", 1)[0] ?? id
  const file = cleanId.startsWith("file:") ? fileURLToPath(cleanId) : cleanId
  if (!path.isAbsolute(file)) return undefined
  try {
    return realpathSync(file)
  } catch {
    return undefined
  }
}
