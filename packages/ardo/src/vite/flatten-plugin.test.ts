import type { Plugin } from "vite"

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { createFlattenPlugin } from "./flatten-plugin"

type FlattenPluginHooks = {
  closeBundle: () => Promise<void> | void
  configResolved: (config: { base: string; build: { outDir: string }; root: string }) => void
}

describe("createFlattenPlugin", () => {
  it("flattens from the resolved build output directory per plugin instance", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ardo-flatten-"))
    try {
      const root = path.join(tmpDir, "project")
      const buildDir = path.join(root, "custom-client")
      await mkdir(path.join(buildDir, "docs"), { recursive: true })
      await writeFile(path.join(buildDir, "docs", "index.html"), "nested", "utf8")

      const plugin = createFlattenPlugin()
      if (!hasFlattenPluginHooks(plugin)) {
        throw new Error("Flatten plugin hooks not found")
      }

      plugin.configResolved({
        base: "/docs/",
        build: { outDir: "custom-client" },
        root,
      })

      await plugin.closeBundle()

      await expect(readFile(path.join(buildDir, "index.html"), "utf8")).resolves.toBe("nested")
    } finally {
      await rm(tmpDir, { force: true, recursive: true })
    }
  })
})

function hasFlattenPluginHooks(plugin: Plugin): plugin is FlattenPluginHooks & Plugin {
  return typeof plugin.configResolved === "function" && typeof plugin.closeBundle === "function"
}
