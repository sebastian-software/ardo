import { describe, expect, it } from "vitest"

import { ARDO_FAVICON_SVG } from "../ui/favicon"
import { createIconAssets } from "./icons"

const TEST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#8b4f66"/></svg>'

describe("createIconAssets", () => {
  it("creates the lean favicon asset set from Ardo's owl", async () => {
    const assets = await createIconAssets()

    expect(assets.map((asset) => asset.fileName)).toStrictEqual([
      "favicon.ico",
      "icon.svg",
      "apple-touch-icon.png",
    ])
    expect(assets.find((asset) => asset.fileName === "icon.svg")?.source).toBe(ARDO_FAVICON_SVG)
  })

  it("creates valid ICO, SVG, and PNG payloads", async () => {
    const assets = await createIconAssets(TEST_SVG)
    const favicon = getAssetBytes(assets, "favicon.ico")
    const appleTouchIcon = getAssetBytes(assets, "apple-touch-icon.png")
    const svg = assets.find((asset) => asset.fileName === "icon.svg")?.source

    expect(favicon.subarray(0, 6).join(",")).toBe("0,0,1,0,1,0")
    expect(appleTouchIcon.subarray(0, 8).join(",")).toBe("137,80,78,71,13,10,26,10")
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

describe("icons with text", () => {
  it("renders glyphs with the system fonts", async () => {
    const assets = await createIconAssets(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="70" font-size="60">A</text></svg>'
    )
    const png = getAssetBytes(assets, "apple-touch-icon.png")

    expect(png.subarray(0, 8).join(",")).toBe("137,80,78,71,13,10,26,10")
  })
})
