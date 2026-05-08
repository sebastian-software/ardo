import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createIconAssets } from "./icons"

const TEST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#8b4f66"/></svg>'

let root: string

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-icons-"))
})

afterEach(async () => {
  await fs.rm(root, { force: true, recursive: true })
})

describe("createIconAssets", () => {
  it("creates the lean favicon asset set", async () => {
    const assets = await createIconAssets(root, { source: TEST_SVG })

    expect(assets.map((asset) => asset.fileName)).toStrictEqual([
      "favicon.ico",
      "icon.svg",
      "apple-touch-icon.png",
    ])
  })

  it("creates valid ICO, SVG, and PNG payloads", async () => {
    const assets = await createIconAssets(root, { source: TEST_SVG })
    const favicon = getAssetBytes(assets, "favicon.ico")
    const appleTouchIcon = getAssetBytes(assets, "apple-touch-icon.png")
    const svg = assets.find((asset) => asset.fileName === "icon.svg")?.source

    expect(favicon.subarray(0, 6).join(",")).toBe("0,0,1,0,1,0")
    expect(appleTouchIcon.subarray(0, 8).join(",")).toBe("137,80,78,71,13,10,26,10")
    expect(svg).toBe(TEST_SVG)
  })

  it("reads an SVG source relative to the Vite root", async () => {
    await fs.mkdir(path.join(root, "app", "assets"), { recursive: true })
    await fs.writeFile(path.join(root, "app", "assets", "logo.svg"), TEST_SVG, "utf8")

    const assets = await createIconAssets(root, { source: "app/assets/logo.svg" })
    const svg = assets.find((asset) => asset.fileName === "icon.svg")?.source

    expect(svg).toBe(TEST_SVG)
  })
})

function getAssetBytes(assets: Awaited<ReturnType<typeof createIconAssets>>, fileName: string) {
  const asset = assets.find((candidate) => candidate.fileName === fileName)
  if (asset == null || typeof asset.source === "string") {
    throw new Error(`Missing binary asset: ${fileName}`)
  }

  return asset.source
}
