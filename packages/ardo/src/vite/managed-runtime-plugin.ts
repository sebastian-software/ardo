import type { Alias, AliasOptions, Plugin, ResolverFunction, UserConfig } from "vite"

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

const managedBrowserIncludes = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
  "react-dom/static",
  "react-router",
  "react-router/dom",
  "lucide-react",
  // Vite's first optimizer scan sees the generated router entry before Ardo's
  // UI chunks. Include Ardo's direct browser graph in the same pass so those
  // later imports cannot invalidate the React entry before hydration starts.
  "ardo > @base-ui/react/accordion",
  "ardo > @vanilla-extract/recipes/createRuntimeFn",
  "ardo > minisearch",
] as const

const browserDependencyNames = new Set([
  ...getManagedRuntimePackageNames(),
  "@base-ui/react",
  "@vanilla-extract/recipes",
  "minisearch",
])

const managedSsrIncludes = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/server",
  "react-dom/static",
  "react-router",
  "lucide-react",
  "ardo > @base-ui/react/accordion",
  "ardo > @vanilla-extract/recipes/createRuntimeFn",
  "ardo > minisearch",
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
  const aliases = getManagedRuntimeAliases(resolutionImporter, getPackageRoot)
  const managedNames = new Set<string>(getManagedRuntimePackageNames())

  return {
    name: "ardo:managed-runtime",
    enforce: "pre",
    config: {
      order: "post",
      handler(config) {
        // Vite resolves optimizeDeps.include using resolve.alias, without
        // running normal resolveId hooks. Claim managed specifiers before caller
        // aliases so they cannot redirect the shared runtime outside Ardo.
        const existingAliases = normalizeAliases(config.resolve?.alias)
        const otherAliases = existingAliases.filter(
          (alias) =>
            !aliases.some(
              (managedAlias) =>
                alias.find === managedAlias.find &&
                alias.replacement === managedAlias.replacement &&
                // Vite 8's optimizer only honors aliases for optimizeDeps.include;
                // normal resolveId hooks cannot provide these managed aliases.
                // eslint-disable-next-line @typescript-eslint/no-deprecated -- Needed for safe identity checks when Vite reapplies config hooks.
                alias.customResolver === managedAlias.customResolver
            )
        )
        const resolve = config.resolve ?? {}
        config.resolve = {
          ...resolve,
          alias: [...aliases, ...otherAliases],
          dedupe: resolve.dedupe?.filter((name) => !managedNames.has(name)),
        }

        // These imports are reached by React Router's generated client entry and
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
  const includes = optimizeDeps?.include ?? []
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

function getManagedRuntimeAliases(
  resolutionImporter: string,
  getPackageRoot: PackageRootResolver
): Alias[] {
  const aliases: Alias[] = []
  for (const name of getManagedRuntimePackageNames()) {
    const customResolver = async function (
      this: ThisParameterType<ResolverFunction>,
      ...[id, _importer, resolveOptions]: Parameters<ResolverFunction>
    ): Promise<Awaited<ReturnType<ResolverFunction>>> {
      if (resolveOptions.custom?.[MANAGED_RUNTIME_RESOLUTION_KEY] === true) return null

      const packageRoot = getPackageRoot(name)
      if (packageRoot == null) {
        throw new Error(
          `[ardo] Managed runtime package "${name}" must be installed as a direct Ardo dependency.`
        )
      }

      // The optimizer's include resolver only sees resolve.alias. Delegate to
      // Vite's own resolver with Ardo as the importer so its browser, development,
      // and SSR export conditions stay intact.
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

      const sourcePath =
        findOptimizedDependencySource(resolved.id, this.environment) ?? canonicalPath(resolved.id)
      if (sourcePath == null || !isPathInsideDirectory(sourcePath, packageRoot)) {
        throw new Error(
          `[ardo] Managed runtime import "${id}" resolved outside Ardo's "${name}" installation.`
        )
      }
      return {
        ...resolved,
        ...(isOptimizerScan(resolveOptions) ? { id: sourcePath } : {}),
        meta: {
          ...resolved.meta,
          [MANAGED_RUNTIME_SOURCE_META_KEY]: { name, sourcePath },
        },
      }
    }
    // @rollup/plugin-alias awaits custom resolvers at runtime, though Vite's public type is sync.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Vite's alias package awaits this resolver.
    const resolver = customResolver as unknown as ResolverFunction
    aliases.push({
      find: name,
      replacement: name,
      customResolver: resolver,
    })
  }
  return aliases
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
