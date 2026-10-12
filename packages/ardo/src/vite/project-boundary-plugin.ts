import type { Plugin } from "vite"

import { isBuiltin } from "node:module"
import path from "node:path"

import { ProjectPackages } from "./project-packages"

/** Apply the docs package boundary to development and production module graphs. */
export function createProjectBoundaryPlugin(): Plugin {
  let packages: ProjectPackages
  const optionalPrefix = "\0ardo:missing-optional:"
  return {
    name: "ardo:project-boundary",
    enforce: "pre",
    configResolved(config) {
      packages = new ProjectPackages(config.root)
    },
    async resolveId(id, importer, options) {
      if (id.startsWith("\0") || id.startsWith("virtual:") || isBuiltin(id)) return
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
      if (!id.startsWith("/") && !packages.checkImport(id, importer)) {
        return optionalPrefix + id
      }
      if (resolved != null) packages.checkFile(resolved.id, importer)
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
          packages.checkImport(id, undefined)
          packages.checkFile(id, path.join(packages.root, "package.json"))
        }
      }
    },
    load(id) {
      if (id.startsWith(optionalPrefix)) {
        const name = id.slice(optionalPrefix.length)
        const message = `[ardo] Optional dependency "${name}" is not installed in the documentation package's dependency tree. Install it there to use this feature.`
        return `throw new Error(${JSON.stringify(message)});`
      }
      packages.checkFile(id)
    },
  }
}
