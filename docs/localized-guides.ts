import path from "node:path"
import { fileURLToPath } from "node:url"
import { isRunnableDevEnvironment, type Plugin } from "vite"
import { generateGuides } from "./scripts/localize-guides.mjs"

/** Materialize PO-backed routes before Ardo scans metadata, search, and LLM exports. */
export function localizedGuides(): Plugin {
  const root = fileURLToPath(new URL(".", import.meta.url))
  const inputs = [path.join(root, "app/content/guide"), path.join(root, "app/i18n/guides")]
  const routes = `${path.join(root, "app/routes")}${path.sep}`
  const generatedModule = (module: { file?: string | null; id?: string | null }) =>
    module.file?.startsWith(routes) || module.id?.startsWith("\0virtual:ardo/")
  let pending = Promise.resolve()
  return {
    name: "docs:localized-guides",
    enforce: "pre",
    async config() {
      await generateGuides()
      // Only authored inputs drive guide refreshes. Watching each generated write
      // would let Vite reload midway through the same multilingual batch.
      return {
        server: {
          watch: { ignored: [/[/\\]app[/\\]routes[/\\](?:en|de|fr|es)[/\\]guide(?:[/\\]|$)/u] },
        },
      }
    },
    configureServer(server) {
      server.watcher.add(inputs)
      const requests = new Set<Promise<void>>()
      // Keep in-flight SSR renders on their existing module graph, and hold new
      // requests until every queued language batch and cache invalidation finishes.
      server.middlewares.use((_request, response, next) => {
        void (async () => {
          let generation
          do {
            generation = pending
            await generation
          } while (generation !== pending)
          let finish!: () => void
          const done = new Promise<void>((resolve) => {
            finish = resolve
          })
          requests.add(done)
          const complete = () => {
            requests.delete(done)
            finish()
          }
          response.once("finish", complete)
          response.once("close", complete)
          next()
        })().catch(next)
      })
      const onChange = (filename: string) => {
        if (!inputs.some((directory) => filename.startsWith(`${directory}${path.sep}`))) return
        if (!filename.endsWith(".mdx") && !filename.endsWith(".po")) return
        pending = pending
          .catch(() => {})
          .then(async () => {
            await Promise.all(requests)
            await generateGuides()
            for (const environment of Object.values(server.environments)) {
              for (const module of environment.moduleGraph.idToModuleMap.values()) {
                if (generatedModule(module)) environment.moduleGraph.invalidateModule(module)
              }
              if (!isRunnableDevEnvironment(environment)) continue
              // Invalidate evaluated routes and their importers too. Clearing the entire
              // runner would recreate React while optimized dependencies still retain it.
              const evaluated = environment.runner.evaluatedModules
              const affected = new Set(
                [...evaluated.idToModuleMap.values()].filter(generatedModule)
              )
              for (const module of affected) {
                for (const id of module.importers) {
                  const importer = evaluated.getModuleById(id)
                  if (importer) affected.add(importer)
                }
              }
              for (const module of affected) evaluated.invalidateModule(module)
            }
            server.ws.send({ type: "full-reload" })
          })
        void pending.catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          server.config.logger.error(message)
          server.ws.send({
            type: "error",
            err: { message, stack: "", plugin: "docs:localized-guides" },
          })
        })
      }
      server.watcher.on("add", onChange)
      server.watcher.on("change", onChange)
      server.watcher.on("unlink", onChange)
      server.httpServer?.once("close", () => {
        server.watcher.off("add", onChange)
        server.watcher.off("change", onChange)
        server.watcher.off("unlink", onChange)
      })
    },
  }
}
