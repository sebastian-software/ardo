import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { mergeConfig, type Plugin, type UserConfig, type ViteDevServer } from "vite"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"

import { resolveConfig } from "../config/index"
import {
  checkInternalLinks,
  createBuildOutputAssets,
  formatLinkCheckDiagnostics,
} from "./build-outputs"
import { ardoCodeBlockPlugin } from "./codeblock-plugin"
import { createFlattenPlugin } from "./flatten-plugin"
import {
  detectGitHash,
  detectGitHubBasename,
  detectGitHubRepoName,
  getGitHubPagesBase,
} from "./git-utils"
import { type ArdoIconOptions, createIconsPlugin } from "./icons"
import { transformMarkdownMeta } from "./markdown-meta"
import { createMdxPlugin, getReactRouterPlugins } from "./mdx-plugin"
import { isPathInsideDirectory, normalizePath, resolveRoutesDir } from "./path-utils"
import { readProjectMeta } from "./project-meta"
import { scanRouteManifest } from "./route-manifest"
import { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
import { generateSearchIndex } from "./search-index"
import { generateContextSidebars, generateSidebar } from "./sidebar-index"
import { createTypeDocPlugin, resolveTypedocConfig } from "./typedoc-plugin"

const VIRTUAL_MODULE_ID = "virtual:ardo/config"
const VIRTUAL_SIDEBAR_ID = "virtual:ardo/sidebar"
const VIRTUAL_SIDEBARS_ID = "virtual:ardo/sidebars"
const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
const RESOLVED_IDS: Record<string, string> = {
  [VIRTUAL_MODULE_ID]: `\0${VIRTUAL_MODULE_ID}`,
  [VIRTUAL_SIDEBAR_ID]: `\0${VIRTUAL_SIDEBAR_ID}`,
  [VIRTUAL_SIDEBARS_ID]: `\0${VIRTUAL_SIDEBARS_ID}`,
  [VIRTUAL_SEARCH_ID]: `\0${VIRTUAL_SEARCH_ID}`,
}

type PluginState = {
  isSsrBuild?: boolean
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

type MainPluginOptions = {
  githubPages: boolean
  pressConfig: PressConfigOptions
  routesDirOption: string | undefined
}

type PressConfigOptions = Omit<
  ArdoPluginOptions,
  "githubPages" | "icons" | "routes" | "routesDir" | "typedoc"
>

export type ArdoPluginOptions = {
  /** Options for the routes generator plugin */
  routes?: ArdoRoutesPluginOptions | false
  /**
   * Generate the lean favicon set recommended for modern websites:
   * /favicon.ico, /icon.svg, and /apple-touch-icon.png.
   *
   * @default true
   */
  icons?: ArdoIconOptions
  /**
   * Auto-detect GitHub repository and set base path for GitHub Pages.
   * @default true
   */
  githubPages?: boolean
  /**
   * Directory where routes are located.
   * @default "./app/routes"
   */
  routesDir?: string
} & Partial<ArdoConfig>

export { detectGitHubBasename }

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  const {
    icons = {},
    routes,
    typedoc,
    githubPages = true,
    routesDir: routesDirOption,
    ...pressConfig
  } = options
  const state: PluginState = { routesDir: resolveRoutesDir(process.cwd(), routesDirOption) }

  const mainPluginOptions: MainPluginOptions = { githubPages, pressConfig, routesDirOption }
  const plugins: Plugin[] = [createMainPlugin(state, mainPluginOptions)]
  plugins.push(...createIconsPlugin(icons))
  addRoutesPlugin(plugins, routes, routesDirOption)
  addTypeDocPlugin(plugins, typedoc, routesDirOption)

  plugins.push(ardoCodeBlockPlugin(pressConfig.markdown))
  plugins.push(createMdxPlugin(pressConfig.markdown))
  plugins.push(...vanillaExtractPlugin({ identifiers: "short" }))
  plugins.push(...getReactRouterPlugins())

  if (githubPages) {
    plugins.push(createFlattenPlugin())
  }

  return plugins
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

function addTypeDocPlugin(
  plugins: Plugin[],
  typedoc: ArdoPluginOptions["typedoc"],
  routesDirOption: string | undefined
): void {
  const typedocConfig = resolveTypedocConfig(typedoc)
  if (typedocConfig != null) {
    plugins.unshift(createTypeDocPlugin(typedocConfig, routesDirOption))
  }
}

function createMainPlugin(state: PluginState, options: MainPluginOptions): Plugin {
  return {
    name: "ardo",
    enforce: "pre",
    config(userConfig, env): UserConfig {
      return createMainConfig(state, {
        userConfig,
        command: env.command,
        githubPages: options.githubPages,
        pressConfig: options.pressConfig,
        routesDirOption: options.routesDirOption,
      })
    },
    configResolved(config) {
      state.isSsrBuild = config.build.ssr !== false
      state.routesDir = resolveRoutesDir(config.root, options.routesDirOption)
      state.resolvedConfig = resolveArdoConfig(config.root, options.pressConfig, config.base)
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

      const manifest = await scanRouteManifest(state.routesDir)
      reportLinkDiagnostics(this, manifest, state.resolvedConfig)
      for (const asset of createBuildOutputAssets(manifest, state.resolvedConfig)) {
        this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
      }
    },
  }
}

function isServerOutput(outputDir: string | undefined) {
  return outputDir?.replaceAll("\\", "/").endsWith("/server") === true
}

function reportLinkDiagnostics(
  context: { error: (message: string) => never; warn: (message: string) => void },
  manifest: Awaited<ReturnType<typeof scanRouteManifest>>,
  config: ResolvedConfig
) {
  const diagnostics = checkInternalLinks(manifest, config)
  if (diagnostics.length === 0) {
    return
  }

  const message = `[ardo] Broken internal links found:\n${formatLinkCheckDiagnostics(diagnostics)}`
  if (config.linkCheck.level === "error") {
    context.error(message)
  } else {
    context.warn(message)
  }
}

function createMainConfig(
  state: PluginState,
  input: {
    command: string
    githubPages: boolean
    pressConfig: PressConfigOptions
    routesDirOption: string | undefined
    userConfig: UserConfig
  }
): UserConfig {
  const { command, githubPages, pressConfig, routesDirOption, userConfig } = input
  const root = userConfig.root ?? process.cwd()
  state.routesDir = resolveRoutesDir(root, routesDirOption)

  const config: UserConfig = {
    define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
    optimizeDeps: { exclude: ["ardo/ui/styles.css"] },
    ssr: { noExternal: ["ardo"] },
  }

  if (githubPages && command === "build" && userConfig.base == null) {
    const repoName = detectGitHubRepoName(root)
    if (repoName != null) {
      config.base = getGitHubPagesBase(repoName)
      console.log(`[ardo] GitHub Pages detected, using base: ${config.base}`)
    }
  }

  if (pressConfig.outDir != null) {
    config.build = { ...config.build, outDir: pressConfig.outDir }
  }

  return mergeArdoViteConfig(pressConfig.vite, config)
}

function resolveArdoConfig(
  root: string,
  pressConfig: PressConfigOptions,
  viteBase: string
): ResolvedConfig {
  const detectedProject = readProjectMeta(root)
  const project: ProjectMeta = { ...detectedProject, ...pressConfig.project }
  const configWithDefaults: ArdoConfig = {
    title: pressConfig.title ?? "Ardo",
    description: pressConfig.description ?? "Documentation powered by Ardo",
  }

  return resolveConfig(
    {
      ...configWithDefaults,
      ...pressConfig,
      base: pressConfig.base ?? viteBase,
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

  return mergeConfig(viteConfig as UserConfig, ardoConfig)
}

function resolveVirtualModuleId(id: string): string | undefined {
  return RESOLVED_IDS[id]
}

async function loadVirtualModule(id: string, state: PluginState): Promise<string | undefined> {
  if (state.resolvedConfig == null) {
    return undefined
  }

  if (id === RESOLVED_IDS[VIRTUAL_MODULE_ID]) {
    const clientConfig = {
      title: state.resolvedConfig.title,
      description: state.resolvedConfig.description,
      base: state.resolvedConfig.base,
      lang: state.resolvedConfig.lang,
      project: state.resolvedConfig.project,
      buildTime: new Date().toISOString(),
      buildHash: detectGitHash(state.resolvedConfig.root),
    }
    return `export default ${JSON.stringify(clientConfig)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_SIDEBAR_ID]) {
    const sidebar = await generateSidebar(state.routesDir, state.resolvedConfig.sidebar)
    return `export default ${JSON.stringify(sidebar)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_SIDEBARS_ID]) {
    const sidebars = await generateContextSidebars(state.routesDir)
    return `export default ${JSON.stringify(sidebars)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_SEARCH_ID]) {
    const searchIndex = await generateSearchIndex(state.routesDir)
    return `export default ${JSON.stringify(searchIndex)}`
  }

  return undefined
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
    RESOLVED_IDS[VIRTUAL_SIDEBAR_ID],
    RESOLVED_IDS[VIRTUAL_SIDEBARS_ID],
    RESOLVED_IDS[VIRTUAL_SEARCH_ID],
  ]

  for (const id of virtualIds) {
    const module = server.moduleGraph.getModuleById(id)
    if (module != null) {
      server.moduleGraph.invalidateModule(module)
    }
  }
}
