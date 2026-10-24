import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import react from "@vitejs/plugin-react"
import { mergeConfig, type Plugin, type UserConfig } from "vite"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"
import type { CollectionsConfig } from "./collections"
import type { ArdoPluginOptions, SiteConfigOptions } from "./plugin-options"

import { resolveConfig } from "../config/index"
import { validateArdoOptionNames } from "../config/plugin-options"
import { addApiPlugin, apiOutputDirectories } from "./api-plugin"
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
import { findArdoPackageRoot } from "./managed-runtime"
import { createRuntimeBoundaryPlugins } from "./managed-runtime-plugin"
import { transformMarkdownMeta } from "./markdown-meta"
import { createMdxPlugin } from "./mdx-plugin"
import { createOpenApiPlugin } from "./openapi-plugin"
import { normalizePath, resolveRoutesDir } from "./path-utils"
import { readProjectMeta } from "./project-meta"
import { createRouteManifestOptions, scanRouteManifest } from "./route-manifest"
import { ardoRoutesPlugin } from "./routes-plugin"
import { createStaticSitePlugin } from "./static-site-plugin"
import { resolveVersionedMainBase, resolveVersionedPreviewBase } from "./versioning"
import { loadVirtualModule, resolveVirtualModuleId } from "./virtual-modules"
import { configureVirtualModuleInvalidation } from "./virtual-module-invalidation"

type PluginState = {
  collections?: CollectionsConfig
  deploymentBase?: string
  outDir?: string
  previewBase?: string
  /** Generated API and OpenAPI folders, which `llms.txt` links by their index. */
  referenceDirs: string[]
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MainPluginOptions = {
  siteConfig: SiteConfigOptions
  routesDirOption: string | undefined
}

export type { ArdoPluginOptions } from "./plugin-options"

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  const {
    content,
    collections,
    icons = {},
    openapi,
    routes,
    api,
    routesDir: routesDirOption,
    ...siteConfig
  } = validateArdoOptionNames(options)
  const state: PluginState = {
    collections,
    outDir: siteConfig.outDir,
    referenceDirs: [
      ...apiOutputDirectories(api),
      ...(openapi == null ? [] : [openapi.out ?? "api"]),
    ],
    routesDir: resolveRoutesDir(process.cwd(), routesDirOption),
  }
  const mainPluginOptions: MainPluginOptions = {
    siteConfig: { ...siteConfig, ...(openapi == null ? {} : { openapi }) },
    routesDirOption,
  }
  const plugins: Plugin[] = [
    createMainPlugin(state, mainPluginOptions),
    createStaticSitePlugin(state),
    ...createRuntimeBoundaryPlugins(),
  ]
  if (openapi != null) plugins.unshift(createOpenApiPlugin(openapi, routesDirOption))
  plugins.push(...createIconsPlugin(resolveBrandIconOptions(icons, siteConfig.brand?.logo), state))
  addContentSourcePlugin(
    plugins,
    [...(content ?? []), ...createCollectionContentSources(collections)],
    routesDirOption
  )
  addRoutesPlugin(plugins, routes, routesDirOption)
  addApiPlugin(plugins, { api, routesDirOption })

  plugins.push(ardoCodeBlockPlugin(siteConfig.markdown))
  plugins.push(createMdxPlugin(siteConfig.markdown))
  plugins.push(...vanillaExtractPlugin({ identifiers: "short" }))
  plugins.push(...createReactPlugins())

  return plugins
}

/**
 * React with React Compiler, which memoizes the project's components in the
 * client build through Oxc's native port (`oxc-transform-react`). Ardo's own
 * package stays excluded like any installed dependency, also when a workspace
 * links it from outside `node_modules`, so every site ships the same UI code.
 */
function createReactPlugins(): Plugin[] {
  const ardoRoot = normalizePath(findArdoPackageRoot())
  return react({
    compiler: true,
    exclude: [/\/node_modules\//u, new RegExp(`^${escapeRegExp(ardoRoot)}/`, "u")],
  })
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`)
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
  const routePluginOptions = routes === false || routes == null ? {} : routes
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
        siteConfig: options.siteConfig,
        routesDirOption: options.routesDirOption,
      })
    },
    configResolved(config) {
      state.routesDir = resolveRoutesDir(config.root, options.routesDirOption)
      state.resolvedConfig = resolveArdoConfig({
        root: config.root,
        siteConfig: options.siteConfig,
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
    transform: {
      // Runs after Ferromark has compiled the route and declared its frontmatter.
      order: "post",
      handler(code, id) {
        return transformMarkdownMeta(code, id, state)
      },
    },
    configureServer(server) {
      configureVirtualModuleInvalidation(server, state)
    },
    async generateBundle() {
      if (this.environment.name !== "client" || state.resolvedConfig == null) return

      const resolvedConfig = state.resolvedConfig
      const manifest = await runArdoLifecyclePhase("metadata:scan", async () =>
        scanRouteManifest(state.routesDir, createRouteManifestOptions(resolvedConfig))
      )
      reportLocalizedRouteDiagnostics(this, manifest, resolvedConfig)
      reportFrontmatterDiagnostics(this, manifest, resolvedConfig)
      await runArdoLifecyclePhase("outputs:emit", () => {
        for (const asset of createBuildOutputAssets(manifest, resolvedConfig, {
          referenceDirs: state.referenceDirs,
        })) {
          this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
        }
      })
    },
  }
}

function createMainConfig(
  state: PluginState,
  input: {
    command: string
    isPreview: boolean
    siteConfig: SiteConfigOptions
    routesDirOption: string | undefined
    userConfig: UserConfig
  }
): UserConfig {
  const { command, isPreview, siteConfig, routesDirOption, userConfig } = input
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
    siteConfig,
    root,
    userBase: userConfig.base,
  })
  state.deploymentBase = baseResult.deploymentBase
  state.previewBase = resolveVersionedPreviewBase({
    deploymentBase: baseResult.deploymentBase,
    versioning: siteConfig.versioning,
    userBase: userConfig.base,
    viteBase: siteConfig.vite?.base,
  })
  if (baseResult.viteBase != null && userConfig.base == null) {
    config.base = isPreview ? (state.previewBase ?? baseResult.viteBase) : baseResult.viteBase
  }
  for (const message of baseResult.logMessages) {
    console.log(message)
  }

  return mergeArdoViteConfig(siteConfig.vite, config)
}

function resolveArdoConfig({
  root,
  siteConfig,
  viteBase,
  deploymentBaseOverride,
}: {
  deploymentBaseOverride: string | undefined
  siteConfig: SiteConfigOptions
  root: string
  viteBase: string
}): ResolvedConfig {
  const detectedProject = readProjectMeta(root)
  const project: ProjectMeta = { ...detectedProject, ...siteConfig.project }
  const deploymentBase =
    deploymentBaseOverride ?? siteConfig.base ?? normalizeViteBaseForArdo(viteBase)
  const configWithDefaults: ArdoConfig = {
    title: siteConfig.title ?? "Ardo",
    description: siteConfig.description ?? "Documentation powered by Ardo",
  }

  return resolveConfig(
    {
      ...configWithDefaults,
      ...siteConfig,
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
