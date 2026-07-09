import type { Plugin, UserConfig } from "vite"

import { describe, expect, it } from "vitest"

import { ardoPlugin } from "./plugin"

type ArdoPluginHooks = {
  config: (config: UserConfig, env: { command: "build" | "serve"; mode: string }) => UserConfig
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

  it("sets Vite base to the current version and default locale when i18n is active", () => {
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

    expect(config.base).toBe("/v3/en/")
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
