/* eslint-disable import/first -- vi.mock must be hoisted before importing the plugin under test. */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- Vite hook tests use minimal plugin and server stubs. */
import type { UserConfig, ViteDevServer } from "vite"

import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  materializeContentSources: vi.fn<() => Promise<number>>(),
  writeRoutesFile: vi.fn<() => Promise<void>>(),
}))

vi.mock("./content-sources", () => ({
  materializeContentSources: mocks.materializeContentSources,
}))
vi.mock("./routes-core", () => ({ writeRoutesFile: mocks.writeRoutesFile }))

import { createContentSourcePlugin } from "./content-sources-plugin"

const { materializeContentSources, writeRoutesFile } = mocks

type ContentSourcePluginHooks = {
  buildStart: () => Promise<void>
  config: (userConfig: { root?: string }) => Promise<void>
  configureServer: (server: ViteDevServer) => void
}

type RawContentSourcePluginHooks = {
  buildStart: () => Promise<void>
  config: (userConfig: UserConfig, env: { command: "build"; mode: string }) => Promise<void>
  configureServer: (server: ViteDevServer) => void
}

type WatchHandler = (changedPath: string) => void

beforeEach(() => {
  materializeContentSources.mockReset()
  materializeContentSources.mockResolvedValue(0)
  writeRoutesFile.mockReset()
  writeRoutesFile.mockResolvedValue(undefined)
})

describe("createContentSourcePlugin", () => {
  it("does not materialize twice during a build after config already ran", async () => {
    const plugin = createTestPlugin()

    await plugin.config({ root: "/project" })
    await plugin.buildStart()

    expect(materializeContentSources).toHaveBeenCalledTimes(1)
    expect(writeRoutesFile).toHaveBeenCalledTimes(1)
  })

  it("serializes watcher materialization runs", async () => {
    const resolvers: Array<() => void> = []
    materializeContentSources.mockImplementation(async () =>
      createMaterializationPromise(resolvers)
    )
    const plugin = createTestPlugin()
    const changeHandlers: WatchHandler[] = []

    plugin.configureServer(
      createTestServer((event, handler) => {
        if (event === "change") {
          changeHandlers.push(handler)
        }
      })
    )

    const [handleChange] = changeHandlers
    expect(handleChange).toBeDefined()

    handleChange("/project/docs/one.md")
    await waitForQueuedWork()
    expect(materializeContentSources).toHaveBeenCalledTimes(1)

    handleChange("/project/docs/two.md")
    await waitForQueuedWork()
    expect(materializeContentSources).toHaveBeenCalledTimes(1)

    resolvers[0]()
    await waitForQueuedWork()
    expect(materializeContentSources).toHaveBeenCalledTimes(2)

    resolvers[1]()
    await vi.waitFor(() => {
      expect(writeRoutesFile).toHaveBeenCalledTimes(2)
    })
  })
})

function createTestPlugin(): ContentSourcePluginHooks {
  const plugin = createContentSourcePlugin([{ from: "docs", to: "external" }], {
    root: "/project",
    routesDirOption: undefined,
  }) as unknown as RawContentSourcePluginHooks

  return {
    async buildStart() {
      await plugin.buildStart()
    },
    async config(userConfig) {
      await plugin.config(userConfig, { command: "build", mode: "production" })
    },
    configureServer(server) {
      plugin.configureServer(server)
    },
  }
}

function createTestServer(onWatch: (event: string, handler: WatchHandler) => void): ViteDevServer {
  return {
    config: { logger: { error: vi.fn() } },
    watcher: {
      add: vi.fn(),
      on: vi.fn((event: string, handler: WatchHandler) => {
        onWatch(event, handler)
      }),
    },
  } as unknown as ViteDevServer
}

async function waitForQueuedWork(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

async function createMaterializationPromise(resolvers: Array<() => void>): Promise<number> {
  return new Promise<number>((resolve) => {
    resolvers.push(() => {
      resolve(0)
    })
  })
}
