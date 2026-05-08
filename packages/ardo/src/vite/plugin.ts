import type { Plugin, UserConfig } from "vite"

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import path from "node:path"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"

import { resolveConfig } from "../config/index"
import { ardoCodeBlockPlugin } from "./codeblock-plugin"
import { createFlattenPlugin } from "./flatten-plugin"
import { detectGitHash, detectGitHubBasename, detectGitHubRepoName } from "./git-utils"
import { type ArdoIconOptions, createIconsPlugin } from "./icons"
import { transformMarkdownMeta } from "./markdown-meta"
import { createMdxPlugin, getReactRouterPlugins } from "./mdx-plugin"
import { readProjectMeta } from "./project-meta"
import { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
import { generateSearchIndex } from "./search-index"
import { generateSidebar } from "./sidebar-index"
import { createTypeDocPlugin, resolveTypedocConfig } from "./typedoc-plugin"

const VIRTUAL_MODULE_ID = "virtual:ardo/config"
const VIRTUAL_SIDEBAR_ID = "virtual:ardo/sidebar"
const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
const RESOLVED_IDS: Record<string, string> = {
  [VIRTUAL_MODULE_ID]: `\0${VIRTUAL_MODULE_ID}`,
  [VIRTUAL_SIDEBAR_ID]: `\0${VIRTUAL_SIDEBAR_ID}`,
  [VIRTUAL_SEARCH_ID]: `\0${VIRTUAL_SEARCH_ID}`,
}

type PluginState = {
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
  addTypeDocPlugin(plugins, typedoc, state)

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
  state: PluginState
): void {
  const typedocConfig = resolveTypedocConfig(typedoc)
  if (typedocConfig != null) {
    plugins.unshift(createTypeDocPlugin(typedocConfig, state.routesDir))
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
        routesDirOption: options.routesDirOption,
      })
    },
    configResolved(config) {
      state.routesDir = resolveRoutesDir(config.root, options.routesDirOption)
      state.resolvedConfig = resolveArdoConfig(config.root, state.routesDir, options.pressConfig)
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
  }
}

function createMainConfig(
  state: PluginState,
  input: {
    command: string
    githubPages: boolean
    routesDirOption: string | undefined
    userConfig: UserConfig
  }
): UserConfig {
  const { command, githubPages, routesDirOption, userConfig } = input
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
      config.base = `/${repoName}/`
      console.log(`[ardo] GitHub Pages detected, using base: ${config.base}`)
    }
  }

  return config
}

function resolveArdoConfig(
  root: string,
  routesDir: string,
  pressConfig: PressConfigOptions
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
      project,
      srcDir: routesDir,
    },
    root
  )
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

  if (id === RESOLVED_IDS[VIRTUAL_SEARCH_ID]) {
    const searchIndex = await generateSearchIndex(state.routesDir)
    return `export default ${JSON.stringify(searchIndex)}`
  }

  return undefined
}

function resolveRoutesDir(root: string, routesDirOption: string | undefined): string {
  return routesDirOption ?? path.join(root, "app", "routes")
}
