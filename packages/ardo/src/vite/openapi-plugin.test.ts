import { EventEmitter } from "node:events"
import path from "node:path"
import { resolveConfig, type Plugin, type ViteDevServer } from "vite"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createOpenApiPlugin } from "./openapi-plugin"

const { generateOpenApiDocs } = vi.hoisted(() => ({
  generateOpenApiDocs: vi.fn().mockResolvedValue(2),
}))

vi.mock("./openapi", () => ({ generateOpenApiDocs }))

function attachServer(plugin: Plugin) {
  const watcher = Object.assign(new EventEmitter(), { add: vi.fn() })
  const logger = { error: vi.fn() }
  // The harness provides only the watcher and logger this plugin uses.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const server = { config: { logger }, watcher } as unknown as ViteDevServer
  const hook =
    typeof plugin.configureServer === "function"
      ? plugin.configureServer
      : plugin.configureServer?.handler
  if (hook != null) Reflect.apply(hook, {}, [server])
  return { logger, watcher }
}

describe("createOpenApiPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("generates reference files only during the client build pass", async () => {
    const ssrPlugin = createOpenApiPlugin({ spec: "openapi.yaml" }, undefined)
    await resolveConfig({ build: { ssr: true }, plugins: [ssrPlugin], root: "/project" }, "build")

    expect(generateOpenApiDocs).not.toHaveBeenCalled()

    const plugin = createOpenApiPlugin({ spec: "openapi.yaml" }, undefined)
    expect(plugin.buildEnd).toBeUndefined()
    await resolveConfig({ plugins: [plugin], root: "/project" }, "build")

    expect(generateOpenApiDocs).toHaveBeenCalledTimes(1)
  })

  it("leaves the generated files alone for vite preview", async () => {
    const plugin = createOpenApiPlugin({ spec: "openapi.yaml" }, undefined)
    await resolveConfig(
      { plugins: [plugin], root: "/project" },
      "serve",
      "production",
      "production",
      true
    )

    expect(generateOpenApiDocs).not.toHaveBeenCalled()
  })

  it("regenerates the reference when the dev server sees the spec change", async () => {
    const plugin = createOpenApiPlugin({ spec: "openapi.yaml" }, undefined)
    await resolveConfig({ plugins: [plugin], root: "/project" }, "serve")
    generateOpenApiDocs.mockClear()
    const { logger, watcher } = attachServer(plugin)

    expect(watcher.add).toHaveBeenCalledWith(path.resolve("/project", "openapi.yaml"))
    watcher.emit("change", path.resolve("/project", "app/routes/index.mdx"))
    watcher.emit("change", path.resolve("/project", "openapi.yaml"))
    await vi.waitFor(() => expect(generateOpenApiDocs).toHaveBeenCalledTimes(1))
    expect(generateOpenApiDocs).toHaveBeenCalledWith(
      expect.objectContaining({ incremental: true, root: "/project" })
    )

    generateOpenApiDocs.mockRejectedValueOnce(new Error("bad spec"))
    watcher.emit("change", path.resolve("/project", "openapi.yaml"))
    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("bad spec"))
    )
  })
})
