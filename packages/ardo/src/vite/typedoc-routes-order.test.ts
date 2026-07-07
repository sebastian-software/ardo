import type { ConfigEnv, ConfigPluginContext, Plugin, UserConfig } from "vite"

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { GeneratedApiDoc } from "../typedoc/types"

import { ardoPlugin } from "./plugin"

vi.mock("../typedoc/generator", async () => {
  const nodeFs = await import("node:fs/promises")
  const nodePath = await import("node:path")

  return {
    generateApiDocs: vi.fn(async (_typedocConfig: unknown, routesDir: string) => {
      const apiDir = nodePath.join(routesDir, "api-reference")
      await nodeFs.mkdir(nodePath.join(apiDir, "functions"), { recursive: true })
      await nodeFs.writeFile(nodePath.join(apiDir, "index.md"), "# API\n", "utf8")
      await nodeFs.writeFile(nodePath.join(apiDir, "functions", "read.md"), "# read\n", "utf8")
      return [
        { path: "index.md", content: "# API\n", frontmatter: { title: "API" } },
        {
          path: "functions/read.md",
          content: "# read\n",
          frontmatter: { title: "read" },
        },
      ] satisfies GeneratedApiDoc[]
    }),
  }
})

let tempDir: string

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-typedoc-routes-"))
  await fs.mkdir(path.join(tempDir, "app", "routes"), { recursive: true })
  await fs.writeFile(
    path.join(tempDir, "app", "routes", "home.tsx"),
    "export default function Home() { return null }\n",
    "utf8"
  )
})

afterEach(async () => {
  await fs.rm(tempDir, { force: true, recursive: true })
})

describe("TypeDoc route generation order", () => {
  it("generates TypeDoc markdown before route config is scanned", async () => {
    const plugins = ardoPlugin({
      githubPages: false,
      typedoc: {
        entryPoints: ["./src/index.ts"],
        tsconfig: "./tsconfig.json",
      },
    })

    const typedocPluginIndex = pluginIndex(plugins, "ardo:typedoc")
    const routesPluginIndex = pluginIndex(plugins, "ardo:routes")
    const reactRouterPluginIndex = pluginNameIndex(plugins, "react-router")
    expect(typedocPluginIndex).toBeLessThan(routesPluginIndex)
    expect(routesPluginIndex).toBeLessThan(reactRouterPluginIndex)

    const messages = await runConfigHooks(plugins.slice(0, routesPluginIndex + 1), {
      root: tempDir,
    })
    expect(messages).toStrictEqual([])

    const routesFile = await fs.readFile(path.join(tempDir, "app", "routes.ts"), "utf8")
    expect(routesFile).toContain('route("api-reference", "routes/api-reference/index.md"),')
    expect(routesFile).toContain(
      'route("api-reference/functions/read", "routes/api-reference/functions/read.md"),'
    )
  })
})

function pluginIndex(plugins: Plugin[], name: string): number {
  const index = plugins.findIndex((plugin) => plugin.name === name)
  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

function pluginNameIndex(plugins: Plugin[], namePart: string): number {
  const index = plugins.findIndex((plugin) => plugin.name.includes(namePart))
  expect(index).toBeGreaterThanOrEqual(0)
  return index
}

async function runConfigHooks(plugins: Plugin[], userConfig: UserConfig): Promise<unknown[]> {
  const messages: unknown[] = []
  const context: ConfigPluginContext = {
    debug(message) {
      messages.push(message)
    },
    error(error) {
      const message = typeof error === "string" ? error : error.message
      throw new Error(message)
    },
    info(message) {
      messages.push(message)
    },
    meta: { rolldownVersion: "0.0.0", rollupVersion: "0.0.0", viteVersion: "0.0.0" },
    warn(message) {
      messages.push(message)
    },
  }
  const env: ConfigEnv = {
    command: "build",
    mode: "production",
    isPreview: false,
    isSsrBuild: false,
  }

  for (const plugin of plugins) {
    const configHook = getConfigHook(plugin)
    if (configHook != null) {
      await configHook.call(context, userConfig, env)
    }
  }

  return messages
}

function getConfigHook(plugin: Plugin): PluginConfigHook | undefined {
  if (plugin.config == null) {
    return undefined
  }

  if (typeof plugin.config === "function") {
    return plugin.config
  }

  return plugin.config.handler
}

type PluginConfigHook = Exclude<Plugin["config"], { handler: unknown } | undefined>
