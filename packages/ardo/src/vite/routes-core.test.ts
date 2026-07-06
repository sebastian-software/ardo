import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { scanRoutesSync } from "./routes-core"

let routesDir: string

beforeEach(async () => {
  routesDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-routes-"))
})

afterEach(async () => {
  await fs.rm(routesDir, { force: true, recursive: true })
})

describe("scanRoutesSync", () => {
  it("only strips markdown extensions from the end of route paths", async () => {
    await writeRoute("v1.md/changelog.md", "# Changelog")

    expect(scanRoutesSync({ dir: routesDir, rootDir: routesDir })).toContainEqual({
      file: "routes/v1.md/changelog.md",
      isIndex: false,
      path: "/v1.md/changelog",
    })
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
