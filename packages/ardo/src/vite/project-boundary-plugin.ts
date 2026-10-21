import type { Plugin } from "vite"

import { existsSync, realpathSync } from "node:fs"
import { isBuiltin } from "node:module"
import path from "node:path"

import {
  findArdoPackageRoot,
  findOptimizedDependencySource,
  getManagedRuntimePackageName,
  MANAGED_RUNTIME_RESOLUTION_KEY,
  MANAGED_RUNTIME_SOURCE_META_KEY,
} from "./managed-runtime"
import { ProjectPackages } from "./project-packages"

type ProjectBoundaryOptions = { ardoRoot?: string; managedRuntime?: boolean }

/** Apply the docs package boundary to development and production module graphs. */
export function createProjectBoundaryPlugin(pluginOptions: ProjectBoundaryOptions = {}): Plugin {
  let packages: ProjectPackages
  const optionalPrefix = "\0ardo:missing-optional:"
  return {
    name: "ardo:project-boundary",
    enforce: "pre",
    configResolved(config) {
      packages = new ProjectPackages(config.root, {
        ardoRoot:
          pluginOptions.ardoRoot ??
          (pluginOptions.managedRuntime ? findArdoPackageRoot() : undefined),
        managedRuntime: pluginOptions.managedRuntime,
      })
    },
    async resolveId(id, importer, resolveOptions) {
      if (resolveOptions.custom?.[MANAGED_RUNTIME_RESOLUTION_KEY] === true) return
      if (id.startsWith("\0") || id.startsWith("virtual:") || isBuiltin(id)) return
      const boundaryImporter = getBoundaryImporter(importer, packages.root, resolveOptions.isEntry)
      const managedName = pluginOptions.managedRuntime
        ? getManagedRuntimePackageName(id)
        : undefined
      if (
        boundaryImporter != null &&
        !id.startsWith("/") &&
        !packages.checkImport(id, boundaryImporter)
      ) {
        return optionalPrefix + id
      }
      const resolved = await this.resolve(id, importer, { ...resolveOptions, skipSelf: true })
      if (resolved != null) {
        const resolvedSourcePath =
          managedSourcePath(
            getMetaValue(resolved.meta, MANAGED_RUNTIME_SOURCE_META_KEY),
            managedName
          ) ?? findOptimizedDependencySource(resolved.id, this.environment)
        packages.checkFile(resolved.id, {
          importer: boundaryImporter,
          managedName,
          managedSourcePath: resolvedSourcePath,
        })
      } else if (boundaryImporter == null && !id.startsWith("/")) {
        packages.checkImport(id, boundaryImporter)
      }
      return resolved
    },
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((entry) => entry.type === "chunk")
      for (const chunk of chunks) {
        const external = [...chunk.imports, ...chunk.dynamicImports].filter((id) => {
          const relative = path.posix.normalize(
            path.posix.join(path.posix.dirname(chunk.fileName), id)
          )
          return !isBuiltin(id) && !Object.hasOwn(bundle, id) && !Object.hasOwn(bundle, relative)
        })
        for (const id of external) {
          const managedName = pluginOptions.managedRuntime
            ? getManagedRuntimePackageName(id)
            : undefined
          if (managedName != null) {
            throw new Error(
              `[ardo] Framework-managed package "${managedName}" cannot remain external; bundle it through Ardo to preserve runtime identity.`
            )
          }
          packages.checkImport(id, undefined)
          packages.checkFile(id, { importer: path.join(packages.root, "package.json") })
        }
      }
    },
    load(id) {
      if (id.startsWith(optionalPrefix)) {
        const name = id.slice(optionalPrefix.length)
        const message = `[ardo] Optional dependency "${name}" is not installed in the documentation package's dependency tree. Install it there to use this feature.`
        return `throw new Error(${JSON.stringify(message)});`
      }
      packages.checkFile(id, {
        managedSourcePath: findOptimizedDependencySource(id, this.environment),
      })
    },
  }
}

function getBoundaryImporter(
  importer: string | undefined,
  root: string,
  isEntry: boolean
): string | undefined {
  if (importer == null || isEntry) return importer
  const cleanImporter = importer.split("?", 1)[0] ?? importer
  // Only an index.html importer can be Vite's synthetic root/index.html, so
  // the realpath lookup is skipped for every other module.
  if (path.basename(cleanImporter) !== "index.html") return importer
  let canonicalImporter = path.resolve(cleanImporter)
  try {
    canonicalImporter = path.join(
      realpathSync(path.dirname(cleanImporter)),
      path.basename(cleanImporter)
    )
  } catch {
    // A missing parent cannot be the synthetic root index.html.
  }
  if (canonicalImporter === path.join(root, "index.html") && !existsSync(cleanImporter)) {
    // Vite uses root/index.html as a synthetic importer for module-graph URL
    // lookups. Treat that as no application importer for ownership checks.
    return undefined
  }
  return importer
}

function getMetaValue(meta: unknown, key: string): unknown {
  if (meta == null || typeof meta !== "object") return undefined
  return Object.getOwnPropertyDescriptor(meta, key)?.value
}

function managedSourcePath(value: unknown, name: string | undefined): string | undefined {
  if (name == null || value == null || typeof value !== "object") return undefined
  const resolution = value as { name?: unknown; sourcePath?: unknown }
  return resolution.name === name && typeof resolution.sourcePath === "string"
    ? resolution.sourcePath
    : undefined
}
