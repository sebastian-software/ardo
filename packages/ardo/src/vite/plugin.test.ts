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

describe("ardoPlugin", () => {
  it("installs managed runtime resolution before the remaining app plugins", () => {
    const plugins = ardoPlugin({ routes: false, icons: false })
    const names = plugins.map((plugin) => plugin.name)
    const boundaryIndex = names.indexOf("ardo:project-boundary")
    const resolverIndex = names.indexOf("ardo:managed-runtime")
    const config = getMainPlugin({ githubPages: false, title: "Docs" }).config(
      { root: "/project" },
      { command: "serve", mode: "development" }
    )

    expect(boundaryIndex).toBeGreaterThan(-1)
    expect(resolverIndex).toBeGreaterThan(boundaryIndex)
    expect(config.optimizeDeps?.exclude).toStrictEqual(["ardo/ui/styles.css"])
    expect(config.environments?.ssr.optimizeDeps?.exclude).toBeUndefined()
  })

  it("isolates the docs dependency graph and preserves consumer options", () => {
    const plugin = getMainPlugin({
      githubPages: false,
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
      githubPages: false,
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

  it("maps outDir to Vite build.outDir", () => {
    const plugin = getMainPlugin({ githubPages: false, title: "Docs", outDir: "custom-build" })

    const config = plugin.config({ root: "/project" }, { command: "build", mode: "production" })

    expect(config.build?.outDir).toBe("custom-build")
  })

  it("sets Vite base to the current major version for versioned docs", () => {
    const plugin = getMainPlugin({
      githubPages: false,
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
      githubPages: false,
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
      githubPages: false,
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

  it("uses the build-time GitHub Pages base when Vite loads config for preview", () => {
    const plugin = getMainPlugin({ githubPages: true, title: "Docs" })

    const config = plugin.config(
      { root: process.cwd() },
      { command: "serve", isPreview: true, mode: "production" }
    )

    expect(config.base).toBe("/ardo/")
  })

  it("keeps the Vite base at the version root when i18n is active", () => {
    const plugin = getMainPlugin({
      githubPages: false,
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
    const plugin = getMainPlugin({ githubPages: false, title: "Docs" })

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
      githubPages: false,
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

    plugin.configResolved({
      base: "/v3/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"versioning":{')
    expect(String(code)).toContain('"i18n":{"defaultLocale":"en"')
  })

  it("normalizes absolute Vite bases before exposing the virtual Ardo config", async () => {
    const plugin = getMainPlugin({ githubPages: false, title: "Docs" })

    plugin.configResolved({
      base: "https://cdn.example.com/assets/docs/",
      build: { ssr: false },
      root: "/project",
    })

    const code = await plugin.load("\0virtual:ardo/config")

    expect(String(code)).toContain('"base":"/assets/docs/"')
  })

  it("normalizes relative Vite bases before exposing the virtual Ardo config", async () => {
    const plugin = getMainPlugin({ githubPages: false, title: "Docs" })

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
      githubPages: false,
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
      githubPages: false,
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
