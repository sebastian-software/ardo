import type { Plugin, UserConfig } from "vite"

import { describe, expect, it } from "vitest"

import { ardoPlugin } from "./plugin"

type ArdoPluginHooks = {
  config: (
    config: UserConfig,
    env: { command: "build" | "serve"; isPreview?: boolean; mode: string }
  ) => UserConfig
  configResolved: (config: { base: string; build: { ssr: boolean }; root: string }) => void
  load: (id: string) => Promise<string | undefined>
}

function getMainPlugin(options: Parameters<typeof ardoPlugin>[0]): ArdoPluginHooks {
  const plugin = ardoPlugin(options).find((entry) => entry.name === "ardo")
  if (plugin == null || !hasArdoPluginHooks(plugin)) {
    throw new Error("Main Ardo plugin not found")
  }
  return plugin
}

function hasArdoPluginHooks(plugin: Plugin): plugin is ArdoPluginHooks & Plugin {
  return (
    typeof plugin.config === "function" &&
    typeof plugin.configResolved === "function" &&
    typeof plugin.load === "function"
  )
}

type TransformHandler = (code: string, id: string) => Promise<{ code: string } | undefined>

type TransformHook = { transform: TransformHandler }

type OrderedTransformHook = { transform: { order: string; handler: TransformHandler } }

function hasTransformHook(plugin: Plugin): plugin is TransformHook & Plugin {
  return typeof plugin.transform === "function"
}

function hasOrderedTransformHook(plugin: Plugin): plugin is OrderedTransformHook & Plugin {
  return typeof plugin.transform === "object" && typeof plugin.transform.handler === "function"
}

function findPlugin<T>(
  plugins: Plugin[],
  name: string,
  guard: (plugin: Plugin) => plugin is T & Plugin
): T {
  const plugin = plugins.find((entry) => entry.name === name)
  if (plugin == null || !guard(plugin)) throw new Error(`Plugin ${name} not found`)
  return plugin
}

describe("ardoPlugin", () => {
  it("installs managed runtime resolution before the remaining app plugins", () => {
    const plugins = ardoPlugin({ routes: false, icons: false })
    const names = plugins.map((plugin) => plugin.name)
    const boundaryIndex = names.indexOf("ardo:project-boundary")
    const resolverIndex = names.indexOf("ardo:managed-runtime")
    const config = getMainPlugin({ title: "Docs" }).config(
      { root: "/project" },
      { command: "serve", mode: "development" }
    )

    expect(boundaryIndex).toBeGreaterThan(-1)
    expect(resolverIndex).toBeGreaterThan(boundaryIndex)
    expect(config.optimizeDeps?.exclude).toStrictEqual(["ardo/ui/styles.css"])
    expect(config.environments?.ssr.optimizeDeps?.exclude).toBeUndefined()
  })

  it("adds page meta to Markdown routes after Ferromark compiles them", async () => {
    const plugins = ardoPlugin({ routes: false, icons: false, title: "Docs" })
    const meta = findPlugin(plugins, "ardo", hasOrderedTransformHook).transform
    expect(meta.order).toBe("post")

    findPlugin(plugins, "ardo", hasArdoPluginHooks).configResolved({
      base: "/",
      build: { ssr: false },
      root: "/project",
    })
    const compile = findPlugin(plugins, "ardo:ferromark", hasTransformHook).transform
    const id = "/project/app/routes/guide/start.mdx"
    const source = "---\ntitle: Start\ndescription: Set up Docs.\n---\n\n# Start\n"
    const compiled = await compile(source, id)
    const result = await meta.handler(String(compiled?.code), id)

    expect(result?.code).toContain('{ title: "Start | Docs" }')
    expect(result?.code).toContain('{ name: "description", content: "Set up Docs." }')
  })

  it("isolates the docs dependency graph and preserves consumer options", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      vite: { ssr: { noExternal: ["consumer-ui"], target: "webworker" } },
    })
    const config = plugin.config({ root: "/project" }, { command: "build", mode: "production" })
    expect(config.ssr?.noExternal).toBe(true)
    expect(config.ssr?.external).toBeUndefined()
    expect(config.resolve?.dedupe).toBeUndefined()
    expect(config.environments?.ssr).toMatchObject({ optimizeDeps: { noDiscovery: false } })
    expect(config.server?.fs).toMatchObject({ strict: true, allow: ["/project"] })
    expect(config.ssr?.target).toBe("webworker")
  })

  it("merges the public vite config option into the returned Vite config", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      vite: {
        define: { __BUILD_TIME__: JSON.stringify("custom"), __CUSTOM__: JSON.stringify(true) },
        server: { port: 4455 },
      },
    })

    const config = plugin.config({ root: "/project" }, { command: "build", mode: "production" })

    expect(config.server?.port).toBe(4455)
    expect(config.define).toMatchObject({
      __BUILD_TIME__: '"custom"',
      __CUSTOM__: "true",
    })
  })

  it("builds the client and server environments into outDir", () => {
    const plugin = ardoPlugin({ title: "Docs", outDir: "custom-build" }).find(
      (entry) => entry.name === "ardo:static-site"
    )
    const hook = plugin?.config
    if (typeof hook !== "function") throw new Error("Static site plugin not found")

    const config = Reflect.apply(hook, {}, [
      { root: "/project" },
      { command: "build", mode: "production" },
    ]) as UserConfig

    expect(config.appType).toBe("custom")
    expect(config.environments?.client?.build?.outDir).toBe("/project/custom-build/client")
    expect(config.environments?.server?.build?.outDir).toBeUndefined()
    expect(config.environments?.ssr?.build?.outDir).toBe("/project/custom-build/server")
  })

  it("sets Vite base to the current major version for versioned docs", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      versioning: {
        current: "v3",
        versions: [{ id: "v3", path: "/v3/" }],
      },
    })

    const config = plugin.config({ root: "/project" }, { command: "build", mode: "production" })

    expect(config.base).toBe("/v3/")
  })

  it("uses the deployment base for versioned preview output", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      versioning: {
        current: "v3",
        versions: [{ id: "v3", path: "/v3/" }],
      },
    })

    const config = plugin.config(
      { root: "/project" },
      { command: "serve", isPreview: true, mode: "production" }
    )

    expect(config.base).toBe("/")
  })

  it("preserves an explicit Vite base for versioned preview output", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      versioning: {
        current: "v3",
        versions: [{ id: "v3", path: "/v3/" }],
      },
    })

    const config = plugin.config(
      { root: "/project", base: "/custom/" },
      { command: "serve", isPreview: true, mode: "production" }
    )

    expect(config.base).toBeUndefined()
  })

  it("uses the configured base when Vite loads config for preview", () => {
    const plugin = getMainPlugin({ base: "/ardo/", title: "Docs" })

    const config = plugin.config(
      { root: process.cwd() },
      { command: "serve", isPreview: true, mode: "production" }
    )

    expect(config.base).toBe("/ardo/")
  })

  it("serves from the root unless base is set", () => {
    const plugin = getMainPlugin({ title: "Docs" })

    const config = plugin.config({ root: process.cwd() }, { command: "build", mode: "production" })

    expect(config.base).toBeUndefined()
  })

  it("keeps the Vite base at the version root when i18n is active", () => {
    const plugin = getMainPlugin({
      title: "Docs",
      versioning: {
        current: "v3",
        versions: [{ id: "v3", path: "/v3/" }],
      },
      i18n: {
        defaultLocale: "en",
        locales: [{ id: "en" }, { id: "de", label: "Deutsch" }],
      },
    })

    const config = plugin.config({ root: "/project" }, { command: "build", mode: "production" })

    expect(config.base).toBe("/v3/")
  })

  it("uses resolved Vite base in the virtual Ardo config", async () => {
    const plugin = getMainPlugin({ title: "Docs" })

    plugin.configResolved({
      base: "/docs/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"base":"/docs/"')
  })

  it("exposes versioning and i18n URL config in the virtual Ardo config", async () => {
    const plugin = getMainPlugin({
      title: "Docs",
      base: "/docs/",
      versioning: {
        current: "v3",
        versions: [{ id: "v3", path: "/v3/" }],
      },
      i18n: {
        defaultLocale: "en",
        locales: [{ id: "en" }, { id: "de", label: "Deutsch" }],
      },
    })

    plugin.configResolved({
      base: "/docs/v3/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"base":"/docs/v3/"')
    expect(String(code)).toContain('"deploymentBase":"/docs/"')
    expect(String(code)).toContain('"versioning":{')
    expect(String(code)).toContain('"i18n":{"defaultLocale":"en"')
  })

  it("normalizes absolute Vite bases before exposing the virtual Ardo config", async () => {
    const plugin = getMainPlugin({ title: "Docs" })

    plugin.configResolved({
      base: "https://cdn.example.com/assets/docs/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"base":"/assets/docs/"')
  })

  it("normalizes relative Vite bases before exposing the virtual Ardo config", async () => {
    const plugin = getMainPlugin({ title: "Docs" })

    plugin.configResolved({
      base: "./",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"base":"/"')
  })

  it("exposes brand config with bundled local logo assets", async () => {
    const plugin = getMainPlugin({
      title: "Docs",
      brand: {
        color: "blue",
        accent: "teal",
        neutral: "slate",
        logo: "./app/assets/logo.svg",
      },
    })

    plugin.configResolved({
      base: "/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('import __ardoBrandLogo0 from "/project/app/assets/logo.svg"')
    expect(String(code)).toContain('"brand":{"color":"blue","accent":"teal","neutral":"slate"}')
    expect(String(code)).toContain("logo: __ardoBrandLogo0")
  })

  it("keeps public brand logo URLs as direct config values", async () => {
    const plugin = getMainPlugin({
      title: "Docs",
      brand: {
        logo: "/logo.svg",
      },
    })

    plugin.configResolved({
      base: "/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).not.toContain("import __ardoBrandLogo")
    expect(String(code)).toContain('logo: "/logo.svg"')
  })
})
