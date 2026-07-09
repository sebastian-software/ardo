import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { mergeConfig, type Plugin, type UserConfig, type ViteDevServer } from "vite"

import type { ArdoConfig, ProjectMeta, ResolvedConfig } from "../config/types"
import type { ContentSourceMapping } from "./content-sources"

import { resolveConfig } from "../config/index"
import { normalizeViteBaseForArdo } from "./base"
import { resolveBrandIconOptions } from "./brand"
import {
  checkInternalLinks,
  createBuildOutputAssets,
  formatLinkCheckDiagnostics,
} from "./build-outputs"
import { ardoCodeBlockPlugin } from "./codeblock-plugin"
import { createContentSourcePlugin } from "./content-sources-plugin"
import { type ArdoIconOptions, createIconsPlugin } from "./icons"
import { runArdoLifecyclePhase } from "./lifecycle"
import { transformMarkdownMeta } from "./markdown-meta"
import { createMdxPlugin, getReactRouterPlugins } from "./mdx-plugin"
import { isPathInsideDirectory, normalizePath, resolveRoutesDir } from "./path-utils"
import { readProjectMeta } from "./project-meta"
import { createRouteManifestOptions, scanRouteManifest } from "./route-manifest"
import { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
import { createTypeDocPlugin, resolveTypedocConfig } from "./typedoc-plugin"
import { resolveVersionedMainBase } from "./versioning"
import {
  loadVirtualModule,
  RESOLVED_IDS,
  resolveVirtualModuleId,
  VIRTUAL_GENERATED_SIDEBARS_ID,
  VIRTUAL_SEARCH_ID,
} from "./virtual-modules"

type PluginState = {
  deploymentBase?: string
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
  "content" | "githubPages" | "icons" | "routes" | "routesDir" | "typedoc"
>

export type ArdoPluginOptions = {
  /** Options for the routes generator plugin */
  routes?: ArdoRoutesPluginOptions | false
  /**
   * Materialize Markdown/MDX files from outside the routes directory into
   * generated route files. This is a narrow bridge until schema-backed content
   * collections land.
   */
  content?: ContentSourceMapping[]
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

export { detectGitHubBasename } from "./git-utils"

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  const {
    content,
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
  plugins.push(...createIconsPlugin(resolveBrandIconOptions(icons, pressConfig.brand?.logo)))
  addContentSourcePlugin(plugins, content, routesDirOption)
  addRoutesPlugin(plugins, routes, routesDirOption)
  addTypeDocPlugin(plugins, typedoc, routesDirOption)

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
      reportLinkDiagnostics(this, manifest, resolvedConfig)
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

  const baseResult = resolveVersionedMainBase({
    command,
    githubPages,
    pressConfig,
    root,
    userBase: userConfig.base,
  })
  state.deploymentBase = baseResult.deploymentBase
  if (baseResult.viteBase != null && userConfig.base == null) {
    config.base = baseResult.viteBase
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
  const virtualIds = [RESOLVED_IDS[VIRTUAL_GENERATED_SIDEBARS_ID], RESOLVED_IDS[VIRTUAL_SEARCH_ID]]

  for (const id of virtualIds) {
    const module = server.moduleGraph.getModuleById(id)
    if (module != null) {
      server.moduleGraph.invalidateModule(module)
    }
  }
}
