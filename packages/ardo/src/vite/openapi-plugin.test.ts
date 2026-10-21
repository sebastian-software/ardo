import { resolveConfig } from "vite"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createOpenApiPlugin } from "./openapi-plugin"

const { generateOpenApiDocs } = vi.hoisted(() => ({
  generateOpenApiDocs: vi.fn().mockResolvedValue(2),
}))

vi.mock("./openapi", () => ({ generateOpenApiDocs }))

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
})
