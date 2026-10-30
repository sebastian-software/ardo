import path from "node:path"
import type { Plugin, ResolvedConfig as ViteConfig } from "vite"
import type { ResolvedConfig } from "../config/types"
import type { PublicationConfig } from "../publication/types"
import { configurePublicationDev } from "./publication-dev"
import { isGeneratedPublicationFile } from "./publication-dev-cache"
import {
  isInside,
  PUBLICATION_ID,
  RESOLVED_PUBLICATION_ID,
  refreshPublication,
  type PublicationBuilder,
} from "./publication-materialize"

/** Own generated routes and assets; canonical content retains its original import provenance. */
export function createPublicationPlugin(
  options: PublicationConfig,
  site: { resolvedConfig?: ResolvedConfig; routesDir: string }
): Plugin {
  const builder: PublicationBuilder = {
    options,
    site,
    prepared: [],
    publications: {},
    sources: new Map(),
    queue: Promise.resolve(),
  }
  return {
    name: "ardo:publication",
    enforce: "pre",
    config(userConfig) {
      const root = path.resolve(userConfig.root ?? process.cwd())
      return {
        server: {
          fs: { allow: [root, path.resolve(root, options.from)] },
          watch: { ignored: [(file) => isGeneratedPublicationFile(file, builder)] },
        },
      }
    },
    async configResolved(config) {
      validateSource(config, builder)
      await refreshPublication(builder)
    },
    resolveId(id, importer) {
      if (id === PUBLICATION_ID) return RESOLVED_PUBLICATION_ID
      if (importer == null || !id.startsWith(".")) return
      const original = builder.sources.get(importer.split("?", 1)[0])
      if (original != null) return this.resolve(id, original, { skipSelf: true })
    },
    load(id) {
      if (id !== RESOLVED_PUBLICATION_ID) return
      const config = site.resolvedConfig
      const locale =
        config?.i18n === false || config?.i18n == null ? "default" : config.i18n.defaultLocale
      return `export const publications = ${JSON.stringify(builder.publications)}; export default publications[${JSON.stringify(locale)}];`
    },
    generateBundle() {
      if (this.environment.name !== "client") return
      const emitted = new Set<string>()
      for (const publication of builder.prepared) {
        for (const asset of [...publication.assets.values(), ...publication.feeds]) {
          if (emitted.has(asset.fileName)) continue
          emitted.add(asset.fileName)
          this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
        }
      }
    },
    configureServer(server) {
      configurePublicationDev(server, builder)
    },
  }
}

function validateSource(config: ViteConfig, builder: PublicationBuilder): void {
  const source = path.resolve(config.root, builder.options.from)
  if (
    config.publicDir !== "" &&
    (isInside(source, config.publicDir) || isInside(config.publicDir, source))
  )
    throw new Error(
      "[ardo] publication.from must be outside Vite's publicDir; otherwise drafts and scheduled source files would be copied into public output."
    )
  if (isInside(source, path.resolve(config.root, builder.site.resolvedConfig?.outDir ?? "build")))
    throw new Error("[ardo] publication.from must be outside the build output directory.")
}
