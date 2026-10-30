import path from "node:path"
import { isRunnableDevEnvironment, type RunnableDevEnvironment, type ViteDevServer } from "vite"
import { isInside, type PublicationBuilder } from "./publication-materialize"

/** Generated writes are one batch; only canonical sources should trigger Vite's watcher. */
export function isGeneratedPublicationFile(file: string, builder: PublicationBuilder): boolean {
  return builder.prepared.some((entry) =>
    isInside(file, path.join(builder.site.routesDir, entry.publication.path))
  )
}

/** Let active renders finish, and hold new requests until the complete batch is ready. */
export function coordinatePublicationRequests(
  server: ViteDevServer,
  builder: PublicationBuilder
): () => Promise<unknown> {
  const requests = new Set<Promise<void>>()
  server.middlewares.use((_request, response, next) => {
    void (async () => {
      let generation
      do {
        generation = builder.queue
        await generation
      } while (generation !== builder.queue)
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
  return () => Promise.all(requests)
}

/** Refresh routes and their importers without recreating React or its optimized dependencies. */
export function invalidatePublicationModules(
  server: ViteDevServer,
  builder: PublicationBuilder
): void {
  const generated = (module: { file?: string | null; id?: string | null }) =>
    (module.file != null && isGeneratedPublicationFile(module.file, builder)) ||
    module.id?.startsWith("\0virtual:ardo/") === true
  for (const environment of Object.values(server.environments)) {
    for (const module of environment.moduleGraph.idToModuleMap.values()) {
      if (generated(module)) environment.moduleGraph.invalidateModule(module)
    }
    if (!isRunnableDevEnvironment(environment)) continue
    invalidateEvaluatedModules(environment, generated)
  }
}

function invalidateEvaluatedModules(
  environment: RunnableDevEnvironment,
  generated: (module: { file?: string | null; id?: string | null }) => boolean
): void {
  const evaluated = environment.runner.evaluatedModules
  const affected = new Set(
    [...evaluated.idToModuleMap.values()].filter((module) => generated(module))
  )
  for (const module of affected) {
    for (const id of module.importers) {
      const importer = evaluated.getModuleById(id)
      if (importer != null) affected.add(importer)
    }
  }
  for (const module of affected) evaluated.invalidateModule(module)
}
