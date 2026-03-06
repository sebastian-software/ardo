import type { Plugin, UserConfig } from "vite"

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import path from "node:path"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"
import type { TypeDocConfig } from "../typedoc/types"

import { resolveConfig } from "../config/index"
import { generateApiDocs } from "../typedoc/generator"
import { ardoCodeBlockPlugin } from "./codeblock-plugin"
import { createFlattenPlugin } from "./flatten-plugin"
import {
  detectGitHash,
  detectGitHubBasename,
  detectGitHubRepoName,
  findPackageRoot,
} from "./git-utils"
import { createMdxPlugin, getReactRouterPlugins } from "./mdx-plugin"
import { readProjectMeta } from "./project-meta"
import { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
import { generateSearchIndex } from "./search-index"
import { generateSidebar } from "./sidebar-index"

const VIRTUAL_MODULE_ID = "virtual:ardo/config"
const VIRTUAL_SIDEBAR_ID = "virtual:ardo/sidebar"
const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
const RESOLVED_IDS: Record<string, string> = {
  [VIRTUAL_MODULE_ID]: `\0${VIRTUAL_MODULE_ID}`,
  [VIRTUAL_SIDEBAR_ID]: `\0${VIRTUAL_SIDEBAR_ID}`,
  [VIRTUAL_SEARCH_ID]: `\0${VIRTUAL_SEARCH_ID}`,
}

let typedocGenerated = false

interface PluginState {
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

interface MainPluginOptions {
  githubPages: boolean
  pressConfig: PressConfigOptions
  routesDirOption: string | undefined
}

type PressConfigOptions = Omit<
  ArdoPluginOptions,
  "githubPages" | "routes" | "routesDir" | "typedoc"
>

export interface ArdoPluginOptions extends Partial<ArdoConfig> {
  /** Options for the routes generator plugin */
  routes?: ArdoRoutesPluginOptions | false
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
}

export { detectGitHubBasename }

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  const {
    routes,
    typedoc,
    githubPages = true,
    routesDir: routesDirOption,
    ...pressConfig
  } = options
  const state: PluginState = { routesDir: resolveRoutesDir(process.cwd(), routesDirOption) }

  const mainPluginOptions: MainPluginOptions = { githubPages, pressConfig, routesDirOption }
  const plugins: Plugin[] = [createMainPlugin(state, mainPluginOptions)]
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
    plugins.unshift(createTypeDocPlugin(typedocConfig, state))
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
    const sidebar = await generateSidebar(state.routesDir)
    return `export default ${JSON.stringify(sidebar)}`
  }

  if (id === RESOLVED_IDS[VIRTUAL_SEARCH_ID]) {
    const searchIndex = await generateSearchIndex(state.routesDir)
    return `export default ${JSON.stringify(searchIndex)}`
  }

  return undefined
}

function transformMarkdownMeta(
  code: string,
  id: string,
  state: PluginState
): { code: string; map: null } | undefined {
  if (!shouldInjectMeta(code, id, state)) {
    return undefined
  }

  const pageTitle = extractFrontmatterValue(code, "title")
  if (pageTitle == null || pageTitle === "") {
    return undefined
  }

  const siteTitle = state.resolvedConfig?.title ?? "Ardo"
  const titleSeparator = state.resolvedConfig?.titleSeparator ?? " | "
  const description = extractFrontmatterValue(code, "description")
  const entries = buildMetaEntries({
    pageTitle,
    siteTitle,
    titleSeparator,
    description,
  })
  return { code: `${code}\nexport const meta = () => [${entries.join(", ")}];\n`, map: null }
}

function shouldInjectMeta(code: string, id: string, state: PluginState): boolean {
  return isMarkdownFile(id) && id.startsWith(state.routesDir) && !hasMetaExport(code)
}

function buildMetaEntries(input: {
  pageTitle: string
  siteTitle: string
  titleSeparator: string
  description?: string
}): string[] {
  const fullTitle = `${input.pageTitle}${input.titleSeparator}${input.siteTitle}`
  const entries = [`{ title: ${JSON.stringify(fullTitle)} }`]
  if (input.description != null && input.description !== "") {
    entries.push(`{ name: "description", content: ${JSON.stringify(input.description)} }`)
  }

  return entries
}

function isMarkdownFile(id: string): boolean {
  return id.endsWith(".md") || id.endsWith(".mdx")
}

function hasMetaExport(code: string): boolean {
  return code.includes("export const meta") || code.includes("export function meta")
}

function extractFrontmatterValue(code: string, key: string): string | undefined {
  const frontmatterStart = code.indexOf("export const frontmatter")
  if (frontmatterStart === -1) {
    return undefined
  }

  const valuePrefix = `${key}: "`
  const valueStart = code.indexOf(valuePrefix, frontmatterStart)
  if (valueStart === -1) {
    return undefined
  }

  const startIndex = valueStart + valuePrefix.length
  const endIndex = code.indexOf('"', startIndex)
  if (endIndex === -1) {
    return undefined
  }

  return code.slice(startIndex, endIndex)
}

function resolveTypedocConfig(typedoc: ArdoPluginOptions["typedoc"]): TypeDocConfig | undefined {
  if (typedoc == null) {
    return undefined
  }

  const packageRoot = findPackageRoot(process.cwd())
  const defaultEntryPoint = packageRoot != null ? `${packageRoot}/src/index.ts` : "./src/index.ts"
  const defaultTsconfig = packageRoot != null ? `${packageRoot}/tsconfig.json` : "./tsconfig.json"
  const defaults: TypeDocConfig = {
    enabled: true,
    entryPoints: [defaultEntryPoint],
    tsconfig: defaultTsconfig,
    out: "api-reference",
    excludePrivate: true,
    excludeInternal: true,
  }

  return typedoc === true ? defaults : { ...defaults, ...typedoc }
}

function createTypeDocPlugin(typedocConfig: TypeDocConfig, state: PluginState): Plugin {
  return {
    name: "ardo:typedoc",
    async buildStart() {
      if (!typedocConfig.enabled || typedocGenerated) {
        return
      }

      typedocGenerated = true
      console.log("[ardo] Generating API documentation with TypeDoc...")
      const startTime = Date.now()

      try {
        const docs = await generateApiDocs(typedocConfig, state.routesDir)
        const duration = Date.now() - startTime
        console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
      } catch (error) {
        console.warn("[ardo] TypeDoc generation failed. API documentation will not be available.")
        console.warn("[ardo] Check your typedoc.entryPoints configuration.")
        if (error instanceof Error) {
          console.warn(`[ardo] Error: ${error.message}`)
        }
      }
    },
  }
}

function resolveRoutesDir(root: string, routesDirOption: string | undefined): string {
  return routesDirOption ?? path.join(root, "app", "routes")
}
