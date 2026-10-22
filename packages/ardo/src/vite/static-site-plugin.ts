import type { Plugin, PreviewServer, ResolvedConfig as ViteResolvedConfig } from "vite"

import { constants } from "node:fs"
import { access, stat } from "node:fs/promises"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"

import { getDefaultLocaleId } from "../config/i18n"
import { createDevRenderMiddleware } from "./dev-render"
import { configureStaticPreview } from "./preview-static"
import { VIRTUAL_ENTRY_CLIENT_ID, VIRTUAL_ENTRY_SERVER_ID } from "./routes-plugin"
import { checkSiteLinks, prerenderSite, resolvePageDirectory } from "./static-site"

const REACT_MODULES = /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/u

export type StaticSiteState = {
  deploymentBase?: string
  outDir?: string
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

/**
 * Build the site as static HTML: a client and a server build, then one HTML
 * file per route and a check of every internal link. In development, the same
 * renderer answers page requests.
 */
export function createStaticSitePlugin(state: StaticSiteState): Plugin {
  let viteConfig: undefined | ViteResolvedConfig

  return {
    name: "ardo:static-site",
    config(userConfig, env) {
      const root = path.resolve(userConfig.root ?? process.cwd())
      const buildDir = path.resolve(root, state.outDir ?? "build")
      return {
        // Ardo renders pages itself; the preview serves the written HTML files.
        appType: env.isPreview === true ? "mpa" : "custom",
        builder: {},
        environments: {
          client: {
            build: {
              emptyOutDir:
                userConfig.environments?.client?.build?.emptyOutDir ??
                userConfig.build?.emptyOutDir ??
                true,
              manifest: true,
              outDir: path.join(buildDir, "client"),
              rolldownOptions: {
                input: VIRTUAL_ENTRY_CLIENT_ID,
                // React gets its own chunk. The entry also carries the site config,
                // build time, and route table, so it changes with every build;
                // returning readers keep React cached until its version changes.
                output: { codeSplitting: { groups: [{ name: "react", test: REACT_MODULES }] } },
              },
            },
          },
          ssr: {
            build: {
              emptyOutDir:
                userConfig.environments?.ssr?.build?.emptyOutDir ??
                userConfig.build?.emptyOutDir ??
                true,
              outDir: path.join(buildDir, "server"),
              rolldownOptions: { input: { index: VIRTUAL_ENTRY_SERVER_ID } },
            },
          },
        },
      }
    },
    configResolved(config) {
      viteConfig = config
    },
    buildApp: {
      async handler(builder) {
        const { client, ssr } = builder.environments
        if (client == null || ssr == null || viteConfig == null) return
        await builder.build(client)
        await builder.build(ssr)
        const clientDir = path.resolve(viteConfig.root, client.config.build.outDir)
        const serverDir = path.resolve(viteConfig.root, ssr.config.build.outDir)
        const config = state.resolvedConfig
        await prerenderSite({
          base: viteConfig.base,
          clientDir,
          deploymentBase: state.deploymentBase ?? viteConfig.base,
          logger: viteConfig.logger,
          serverEntry: path.join(serverDir, "index.js"),
        })
        if (config != null) {
          checkSiteLinks({
            base: viteConfig.base,
            clientDir,
            linkCheck: config.linkCheck,
            logger: viteConfig.logger,
            siteUrl: config.siteUrl,
          })
        }
      },
    },
    async configurePreviewServer(server) {
      await assertPreviewEntry(server, state.resolvedConfig)
      return configureStaticPreview(server)
    },
    configureServer(server) {
      // Runs after Vite's own middleware, so modules and public files win.
      return () => {
        server.middlewares.use(createDevRenderMiddleware(server, state.routesDir))
      }
    },
  }
}

/** Validate the configured home, which may live below a version and locale prefix. */
async function assertPreviewEntry(
  server: PreviewServer,
  config: ResolvedConfig | undefined
): Promise<void> {
  const clientDir = path.resolve(server.config.root, server.config.build.outDir)
  if (await isReadableFile(path.join(clientDir, "index.html"))) return
  const pageDir =
    config == null ? clientDir : resolvePageDirectory(clientDir, config.base, config.deploymentBase)
  const locale = getDefaultLocaleId(config?.i18n ?? false)
  const entry = path.join(pageDir, locale ?? "", "index.html")
  if (!(await isReadableFile(entry))) {
    throw new Error(
      `No index.html found for the configured home page at ${entry}. Add a home route such as app/routes/home.tsx, then run "ardo build" before "ardo preview".`
    )
  }
}

async function isReadableFile(file: string): Promise<boolean> {
  try {
    const entryStat = await stat(file)
    if (!entryStat.isFile()) return false
    await access(file, constants.R_OK)
    return true
  } catch {
    return false
  }
}
