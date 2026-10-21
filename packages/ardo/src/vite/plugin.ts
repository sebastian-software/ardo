import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { mergeConfig, type Plugin, type UserConfig, type ViteDevServer } from "vite"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"
import type { CollectionsConfig } from "./collections"
import type { ArdoPluginOptions, PressConfigOptions } from "./plugin-options"

import { resolveConfig } from "../config/index"
import { addApiPlugin } from "./api-plugin"
import { normalizeViteBaseForArdo } from "./base"
import { resolveBrandIconOptions } from "./brand"
import { createBuildOutputAssets } from "./build-outputs"
import { ardoCodeBlockPlugin } from "./codeblock-plugin"
import { createCollectionContentSources } from "./collections"
import { createContentSourcePlugin } from "./content-sources-plugin"
import { reportFrontmatterDiagnostics } from "./frontmatter-diagnostics"
import { reportLocalizedRouteDiagnostics } from "./i18n-routes"
import { createIconsPlugin } from "./icons"
import { runArdoLifecyclePhase } from "./lifecycle"
import { reportOrDeferLinkDiagnostics } from "./link-diagnostics"
import { createRuntimeBoundaryPlugins } from "./managed-runtime-plugin"
import { transformMarkdownMeta } from "./markdown-meta"
import { createMdxPlugin, getReactRouterPlugins } from "./mdx-plugin"
import { createOpenApiPlugin } from "./openapi-plugin"
import { isPathInsideDirectory, normalizePath, resolveRoutesDir } from "./path-utils"
import { readProjectMeta } from "./project-meta"
import { createRouteManifestOptions, scanRouteManifest } from "./route-manifest"
import { ardoRoutesPlugin } from "./routes-plugin"
import { resolveVersionedMainBase, resolveVersionedPreviewBase } from "./versioning"
import {
  loadVirtualModule,
  RESOLVED_IDS,
  resolveVirtualModuleId,
  VIRTUAL_COLLECTIONS_ID,
  VIRTUAL_GENERATED_SIDEBARS_ID,
  VIRTUAL_SEARCH_ID,
} from "./virtual-modules"

type PluginState = {
  collections?: CollectionsConfig
  deploymentBase?: string
  isSsrBuild?: boolean
  previewBase?: string
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MainPluginOptions = {
  githubPages: boolean
  pressConfig: PressConfigOptions
  routesDirOption: string | undefined
}

export { detectGitHubBasename } from "./git-utils"

export type { ArdoPluginOptions } from "./plugin-options"

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  if ("typedoc" in options)
    throw new Error(
      "[ardo] The typedoc option was removed. Configure api instead; see the TypeDoc migration guide."
    )
  const {
    content,
    collections,
    icons = {},
    openapi,
    routes,
    api,
    githubPages = true,
    routesDir: routesDirOption,
    ...pressConfig
  } = options
  const state: PluginState = {
    collections,
    routesDir: resolveRoutesDir(process.cwd(), routesDirOption),
  }
  const mainPluginOptions: MainPluginOptions = {
    githubPages,
    pressConfig: { ...pressConfig, ...(openapi == null ? {} : { openapi }) },
    routesDirOption,
  }
  const plugins: Plugin[] = [
    createMainPlugin(state, mainPluginOptions),
    ...createRuntimeBoundaryPlugins(),
  ]
  if (openapi != null) plugins.unshift(createOpenApiPlugin(openapi, routesDirOption))
  plugins.push(...createIconsPlugin(resolveBrandIconOptions(icons, pressConfig.brand?.logo)))
  addContentSourcePlugin(
    plugins,
    [...(content ?? []), ...createCollectionContentSources(collections)],
    routesDirOption
  )
  addRoutesPlugin(plugins, routes, routesDirOption)
  addApiPlugin(plugins, { api, routesDirOption })

  plugins.push(ardoCodeBlockPlugin(pressConfig.markdown))
  plugins.push(createMdxPlugin(pressConfig.markdown))
  plugins.push(...vanillaExtractPlugin({ identifiers: "short" }))
  plugins.push(...getReactRouterPlugins())

  return plugins
}

function addContentSourcePlugin(
  plugins: Plugin[],
  content: ArdoPluginOptions["content"],
  routesDirOption: string | undefined
): void {
  if (content == null || content.length === 0) {
    return
  }

  plugins.push(
    createContentSourcePlugin(content, {
      root: process.cwd(),
      routesDirOption,
    })
  )
}

function addRoutesPlugin(
  plugins: Plugin[],
  routes: ArdoPluginOptions["routes"],
  routesDirOption: string | undefined
): void {
  if (routes === false) {
    return
  }

  const routePluginOptions = routes ?? {}
  plugins.push(ardoRoutesPlugin({ routesDir: routesDirOption, ...routePluginOptions }))
}

function createMainPlugin(state: PluginState, options: MainPluginOptions): Plugin {
  return {
    name: "ardo",
    enforce: "pre",
    config(userConfig, env): UserConfig {
      return createMainConfig(state, {
        userConfig,
        command: env.isPreview ? "build" : env.command,
        isPreview: env.isPreview === true,
        githubPages: options.githubPages,
        pressConfig: options.pressConfig,
        routesDirOption: options.routesDirOption,
      })
    },
    configResolved(config) {
      state.isSsrBuild = config.build.ssr !== false
      state.routesDir = resolveRoutesDir(config.root, options.routesDirOption)
      state.resolvedConfig = resolveArdoConfig({
        root: config.root,
        pressConfig: options.pressConfig,
        viteBase: config.base,
        deploymentBaseOverride: state.deploymentBase,
      })
    },
    resolveId(id) {
      return resolveVirtualModuleId(id)
    },
    async load(id) {
      return loadVirtualModule(id, state)
    },
    transform(code, id) {
      return transformMarkdownMeta(code, id, state)
    },
    configureServer(server) {
      configureVirtualModuleInvalidation(server, state)
    },
    async generateBundle(outputOptions) {
      if (state.isSsrBuild || isServerOutput(outputOptions.dir) || state.resolvedConfig == null) {
        return
      }

      const resolvedConfig = state.resolvedConfig
      const manifest = await runArdoLifecyclePhase("metadata:scan", async () =>
        scanRouteManifest(state.routesDir, createRouteManifestOptions(resolvedConfig))
      )
      reportLocalizedRouteDiagnostics(this, manifest, resolvedConfig)
      reportFrontmatterDiagnostics(this, manifest, resolvedConfig)
      reportOrDeferLinkDiagnostics(this, manifest, {
        config: resolvedConfig,
        clientDir: outputOptions.dir,
      })
      await runArdoLifecyclePhase("outputs:emit", () => {
        for (const asset of createBuildOutputAssets(manifest, resolvedConfig)) {
          this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
        }
      })
    },
  }
}

function isServerOutput(outputDir: string | undefined) {
  return outputDir?.replaceAll("\\", "/").endsWith("/server") === true
}

function createMainConfig(
  state: PluginState,
  input: {
    command: string
    githubPages: boolean
    isPreview: boolean
    pressConfig: PressConfigOptions
    routesDirOption: string | undefined
    userConfig: UserConfig
  }
): UserConfig {
  const { command, githubPages, isPreview, pressConfig, routesDirOption, userConfig } = input
  const root = userConfig.root ?? process.cwd()
  state.routesDir = resolveRoutesDir(root, routesDirOption)
  const config: UserConfig = {
    define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
    optimizeDeps: { exclude: ["ardo/ui/styles.css"] },
    // Bundle components and their server renderer in the same dependency graph.
    server: { fs: { strict: true, allow: [root] } },
    ssr: { noExternal: true },
    // Transform CommonJS dependencies before the development SSR module runner loads them.
    environments: { ssr: { optimizeDeps: { noDiscovery: false } } },
  }

  const baseResult = resolveVersionedMainBase({
    command,
    githubPages,
    pressConfig,
    root,
    userBase: userConfig.base,
  })
  state.deploymentBase = baseResult.deploymentBase
  state.previewBase = resolveVersionedPreviewBase({
    deploymentBase: baseResult.deploymentBase,
    versioning: pressConfig.versioning,
    userBase: userConfig.base,
    viteBase: pressConfig.vite?.base,
  })
  if (baseResult.viteBase != null && userConfig.base == null) {
    config.base = isPreview ? (state.previewBase ?? baseResult.viteBase) : baseResult.viteBase
  }
  for (const message of baseResult.logMessages) {
    console.log(message)
  }

  if (pressConfig.outDir != null) {
    config.build = { ...config.build, outDir: pressConfig.outDir }
  }

  return mergeArdoViteConfig(pressConfig.vite, config)
}

function resolveArdoConfig({
  root,
  pressConfig,
  viteBase,
  deploymentBaseOverride,
}: {
  deploymentBaseOverride: string | undefined
  pressConfig: PressConfigOptions
  root: string
  viteBase: string
}): ResolvedConfig {
  const detectedProject = readProjectMeta(root)
  const project: ProjectMeta = { ...detectedProject, ...pressConfig.project }
  const deploymentBase =
    deploymentBaseOverride ?? pressConfig.base ?? normalizeViteBaseForArdo(viteBase)
  const configWithDefaults: ArdoConfig = {
    title: pressConfig.title ?? "Ardo",
    description: pressConfig.description ?? "Documentation powered by Ardo",
  }

  return resolveConfig(
    {
      ...configWithDefaults,
      ...pressConfig,
      base: deploymentBase,
      project,
    },
    root
  )
}

function mergeArdoViteConfig(
  viteConfig: Record<string, unknown> | undefined,
  ardoConfig: UserConfig
): UserConfig {
  if (viteConfig == null) {
    return ardoConfig
  }

  return mergeConfig(ardoConfig, viteConfig as UserConfig)
}

function configureVirtualModuleInvalidation(server: ViteDevServer, state: PluginState): void {
  server.watcher.add(state.routesDir)

  const handleRouteContentChange = (changedPath: string) => {
    if (!shouldInvalidateRouteVirtualModules(changedPath, state.routesDir)) {
      return
    }

    invalidateVirtualModules(server)
    server.ws.send({ type: "full-reload" })
  }

  server.watcher.on("add", handleRouteContentChange)
  server.watcher.on("change", handleRouteContentChange)
  server.watcher.on("unlink", handleRouteContentChange)
}

function shouldInvalidateRouteVirtualModules(changedPath: string, routesDir: string): boolean {
  const normalizedPath = normalizePath(changedPath)
  return (
    isPathInsideDirectory(normalizedPath, routesDir) &&
    (normalizedPath.endsWith(".md") || normalizedPath.endsWith(".mdx"))
  )
}

function invalidateVirtualModules(server: ViteDevServer): void {
  const virtualIds = [
    RESOLVED_IDS[VIRTUAL_COLLECTIONS_ID],
    RESOLVED_IDS[VIRTUAL_GENERATED_SIDEBARS_ID],
    RESOLVED_IDS[VIRTUAL_SEARCH_ID],
  ]

  for (const id of virtualIds) {
    const module = server.moduleGraph.getModuleById(id)
    if (module != null) {
      server.moduleGraph.invalidateModule(module)
    }
  }
}
