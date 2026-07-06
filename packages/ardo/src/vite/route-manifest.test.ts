import { mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { scanRouteManifest } from "./route-manifest"

describe("scanRouteManifest", () => {
  it("extracts unicode and deduplicated heading anchors", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ardo-routes-"))
    try {
      await writeFile(
        path.join(tmpDir, "guide.mdx"),
        ["# Guide", "## Über uns", "## Über uns", "## `API` & Usage"].join("\n"),
        "utf8"
      )

      const [entry] = await scanRouteManifest(tmpDir)

      expect(entry.anchors).toStrictEqual(["guide", "über-uns", "über-uns-1", "api-usage"])
    } finally {
      await rm(tmpDir, { force: true, recursive: true })
    }
  })
})
