import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { scanRoutesSync } from "./routes-core"

let routesDir: string

beforeEach(() => {
  routesDir = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-routes-"))
})

afterEach(() => {
  fs.rmSync(routesDir, { force: true, recursive: true })
})

describe("scanRoutesSync", () => {
  it("strips only the final route extension from nested paths", () => {
    writeRoute("v1.md/changelog.md", "# Changelog")
    writeRoute("guide/changelog.md.mdx", "# Changelog")

    expect(scanRoutesSync({ dir: routesDir, rootDir: routesDir })).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/v1.md/changelog" }),
        expect.objectContaining({ path: "/guide/changelog.md" }),
      ])
    )
  })
})

function writeRoute(relativePath: string, content: string): void {
  const filePath = path.join(routesDir, relativePath)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, "utf8")
}
