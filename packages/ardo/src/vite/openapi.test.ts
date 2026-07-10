import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { generateOpenApiDocs } from "./openapi"

let root: string

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-openapi-"))
  await fs.mkdir(path.join(root, "app", "routes"), { recursive: true })
})

afterEach(async () => {
  await fs.rm(root, { force: true, recursive: true })
})

describe("generateOpenApiDocs", () => {
  it("generates static reference routes from a local YAML spec", async () => {
    await fs.writeFile(
      path.join(root, "openapi.yaml"),
      "openapi: 3.1.0\ninfo:\n  title: Pets\npaths:\n  /pets:\n    get:\n      tags: [Pets]\n      summary: List pets\n      responses:\n        '200':\n          description: OK\n"
    )
    await expect(
      generateOpenApiDocs({
        config: { spec: "openapi.yaml" },
        root,
        routesDir: path.join(root, "app", "routes"),
      })
    ).resolves.toBe(2)
    await expect(
      fs.readFile(path.join(root, "app", "routes", "api", "pets", "get-pets.mdx"), "utf8")
    ).resolves.toContain("# GET /pets")
  })
})
