import type { ConfigEnv, PluginOption, UserConfig, UserConfigExport } from "vite"

import { fileURLToPath } from "node:url"
import { resolveConfig as resolveViteConfig } from "vite"
import { describe, expect, it } from "vitest"

import type { ArdoProjectConfigExport } from "../config/project"

import { ardoPlugin as ardo } from "./plugin"
import { createArdoProjectViteConfig } from "./project-config"

const environment: ConfigEnv = {
  command: "serve",
  mode: "development",
  isSsrBuild: false,
  isPreview: false,
}

async function ardoOptions(env: ConfigEnv) {
  await new Promise<void>((resolve) => {
    setImmediate(() => {
      resolve()
    })
  })
  return { title: env.command === "build" ? "Docs (build)" : "Docs" }
}

describe("createArdoProjectViteConfig", () => {
  it.each(["serve", "build"] as const)(
    "activates plugins from ardo.config during Vite %s configuration exactly once",
    async (command) => {
      let calls = 0
      let viteCalls = 0
      const config = await createArdoProjectViteConfig(
        fileURLToPath(new URL("../../../../examples/basic", import.meta.url)),
        {
          ardoConfig: async () => ({
            icons: false,
            routes: false,
            vite: {
              define: { __ARDO_CONFIG__: "true" },
              plugins: [
                false,
                [
                  Promise.resolve({
                    name: "consumer-config-plugin",
                    config() {
                      calls += 1
                      return { define: { __CONSUMER_PLUGIN__: "true" } }
                    },
                  }),
                ],
              ],
            },
          }),
          viteConfig: {
            plugins: [
              {
                name: "vite-config-plugin",
                config() {
                  viteCalls += 1
                },
              },
            ],
          },
        }
      )({ ...environment, command })
      const resolved = await resolveViteConfig(
        { ...config, configFile: false, logLevel: "silent" },
        command
      )

      expect(calls).toBe(1)
      expect(viteCalls).toBe(1)
      expect(resolved.define?.__CONSUMER_PLUGIN__).toBe("true")
      expect(resolved.define?.__ARDO_CONFIG__).toBe("true")
      expect(
        resolved.plugins.filter((plugin) => plugin.name === "consumer-config-plugin")
      ).toHaveLength(1)
      expect(resolved.plugins.filter(isArdoPlugin)).toHaveLength(1)
    }
  )

  it("adds Ardo with default options and preserves the app's Vite config", async () => {
    const appPlugin = { name: "app-plugin" }
    const config = await createArdoProjectViteConfig("/project", {
      viteConfig: {
        base: "/docs/",
        plugins: [appPlugin],
      },
    })(environment)

    expect(config.root).toBe("/project")
    expect(config.base).toBe("/docs/")
    expect(config.plugins).toContain(appPlugin)
    expect(config.plugins?.some((option) => isArdoPlugin(option))).toBe(true)
  })

  it("resolves object, promise, and async callback exports per Vite environment", async () => {
    const viteOptions = new Promise<UserConfig>((resolve) => {
      resolve({ base: "/object/" })
    })
    const config = await createArdoProjectViteConfig("/project", {
      ardoConfig: ardoOptions,
      viteConfig: viteOptions,
    })(environment)
    const buildConfig = await createArdoProjectViteConfig("/project", {
      ardoConfig: ardoOptions,
      viteConfig: (env) => ({
        base: env.command === "build" ? "/build/" : "/serve/",
      }),
    })({ ...environment, command: "build" })

    expect(config.base).toBe("/object/")
    expect(config.plugins?.some((option) => isArdoPlugin(option))).toBe(true)
    expect(buildConfig.base).toBe("/build/")
    expect(buildConfig.plugins?.some((option) => isArdoPlugin(option))).toBe(true)
  })

  it("keeps an Ardo plugin already declared by vite.config exactly once", async () => {
    const existingArdo = ardo({ routes: false })
    const vitePlugins: PluginOption[] = [[Promise.resolve(existingArdo)]]
    const config = await createArdoProjectViteConfig("/project", {
      viteConfig: { plugins: vitePlugins },
    })(environment)

    expect(config.plugins).toBe(vitePlugins)
    expect(config.plugins).toHaveLength(1)
    expect(config.plugins?.[0]).toBe(vitePlugins[0])
  })

  it("reports when ardo.config and vite.config both configure Ardo", async () => {
    const existingArdo = ardo({ routes: false })
    const resolveConfig = createArdoProjectViteConfig("/project", {
      ardoConfig: { title: "Docs" },
      viteConfig: { plugins: [existingArdo] },
    })

    await expect(resolveConfig(environment)).rejects.toThrow(
      "Both ardo.config and vite.config configure Ardo"
    )
  })

  it.each(["invalid", null, []])("rejects invalid Vite config export %p", async (value) => {
    const resolveConfig = createArdoProjectViteConfig("/project", {
      viteConfig: asInvalidViteConfigExport(value),
    })

    await expect(resolveConfig(environment)).rejects.toThrow(
      "[ardo] Invalid Vite config: expected a Vite config object or a function returning one."
    )
  })

  it.each(["invalid", null, []])("rejects invalid Ardo config export %p", async (value) => {
    const resolveConfig = createArdoProjectViteConfig("/project", {
      ardoConfig: asInvalidArdoConfigExport(value),
    })

    await expect(resolveConfig(environment)).rejects.toThrow(
      "[ardo] Invalid Ardo config: expected an Ardo options object or a function returning one."
    )
  })

  it("validates values returned by config callbacks", async () => {
    const invalidViteCallback = asInvalidViteConfigExport(() => "invalid")
    const invalidArdoCallback = asInvalidArdoConfigExport(() => null)

    await expect(
      createArdoProjectViteConfig("/project", { viteConfig: invalidViteCallback })(environment)
    ).rejects.toThrow("[ardo] Invalid Vite config")
    await expect(
      createArdoProjectViteConfig("/project", { ardoConfig: invalidArdoCallback })(environment)
    ).rejects.toThrow("[ardo] Invalid Ardo config")
  })

  it("reports a present config file without a default export", async () => {
    await expect(
      createArdoProjectViteConfig("/project", {
        sources: { viteConfigPath: "/project/vite.config.js" },
      })(environment)
    ).rejects.toThrow(
      '[ardo] Invalid Vite config at "/project/vite.config.js": expected a Vite config object or a function returning one.'
    )

    await expect(
      createArdoProjectViteConfig("/project", {
        sources: { ardoConfigPath: "/project/ardo.config.js" },
      })(environment)
    ).rejects.toThrow(
      '[ardo] Invalid Ardo config at "/project/ardo.config.js": expected an Ardo options object or a function returning one.'
    )
  })
})

function isArdoPlugin(option: unknown): boolean {
  return typeof option === "object" && option !== null && "name" in option && option.name === "ardo"
}

function asInvalidViteConfigExport(value: unknown): UserConfigExport {
  // Invalid JS config values cannot satisfy the exported TypeScript config types.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return value as UserConfigExport
}

function asInvalidArdoConfigExport(value: unknown): ArdoProjectConfigExport {
  // Invalid JS config values cannot satisfy the exported TypeScript config types.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return value as ArdoProjectConfigExport
}
