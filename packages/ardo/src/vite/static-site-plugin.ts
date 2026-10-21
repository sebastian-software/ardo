import type { Plugin, ResolvedConfig as ViteResolvedConfig } from "vite"

import path from "node:path"

import type { ResolvedConfig } from "../config/types"

import { createDevRenderMiddleware } from "./dev-render"
import { configureStaticPreview } from "./preview-static"
import { VIRTUAL_ENTRY_CLIENT_ID, VIRTUAL_ENTRY_SERVER_ID } from "./routes-plugin"
import { checkSiteLinks, prerenderSite } from "./static-site"

const REACT_MODULES = /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/u

export type StaticSiteState = {
  deploymentBase?: string
  outDir?: string
  resolvedConfig?: ResolvedConfig
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
              emptyOutDir: true,
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
              emptyOutDir: true,
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
    configurePreviewServer(server) {
      return configureStaticPreview(server)
    },
    configureServer(server) {
      // Runs after Vite's own middleware, so modules and public files win.
      return () => {
        server.middlewares.use(createDevRenderMiddleware(server))
      }
    },
  }
}
