import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { ImageAsset } from "./image-pipeline"
import { ardoImagePresets } from "../images/presets"
import { rasterImageKey } from "./image-cache"

const roots: string[] = []
beforeEach(() => {
  vi.stubEnv("ARDO_CACHE", "true")
})
afterEach(() => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

async function project(): Promise<string> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-image-cache-"))
  roots.push(root)
  fs.mkdirSync(path.join(root, "public"))
  await sharp({ create: { width: 64, height: 48, channels: 3, background: "#3366aa" } })
    .png()
    .toFile(path.join(root, "public/photo.png"))
  return root
}

function post(root: string, language: string, text: { alt: string; caption?: string }) {
  return {
    root,
    sourceFile: path.join(root, `content/${language}/post.md`),
    base: "/",
    assets: new Map<string, ImageAsset>(),
    config: { widths: [16, 32] },
    image: { src: "/photo.png", ...text, core: { x: 0.5, y: 0.5, size: 0.4 } },
  }
}

it("keys renditions only by what changes the written files", () => {
  const source = Buffer.from("pixels")
  const base = {
    base: "/",
    preset: ardoImagePresets.article!,
    image: { src: "./a.png", alt: "Ein Foto", caption: "Bildunterschrift", margin: 0.1 },
  }
  const key = rasterImageKey(source, base)
  expect(
    rasterImageKey(source, {
      ...base,
      image: { src: "../shared/a.png", alt: "A photo", caption: "Caption", margin: 0.1 },
    })
  ).toBe(key)
  for (const changed of [
    { ...base, image: { ...base.image, margin: 0.2 } },
    { ...base, image: { ...base.image, core: { x: 0.5, y: 0.5, size: 0.4 } } },
    { ...base, base: "/de/" },
    { ...base, jpegFallback: false },
    { ...base, config: { widths: [320] } },
    { ...base, preset: ardoImagePresets.card! },
  ])
    expect(rasterImageKey(source, changed)).not.toBe(key)
  expect(rasterImageKey(Buffer.from("other pixels"), base)).not.toBe(key)
})

it("shares one cache entry between language versions and keeps each one's alt text", async () => {
  const root = await project()
  // Fresh modules stand in for separate `ardo build` processes per language variant.
  const build = async (input: ReturnType<typeof post>) => {
    vi.resetModules()
    const { preparePostImage } = await import("./post-images")
    const sharpModule = await import("sharp")
    const encode = vi.spyOn(sharpModule.default.prototype, "avif")
    const image = await preparePostImage(input)
    const encoded = encode.mock.calls.length
    encode.mockRestore()
    return { image, encoded, assets: [...input.assets.keys()].sort() }
  }

  const german = await build(post(root, "de", { alt: "Ein Foto", caption: "Bildunterschrift" }))
  const english = await build(post(root, "en", { alt: "A photo" }))
  const entries = fs.readdirSync(path.join(root, "node_modules/.cache/ardo/images"))

  expect(german.encoded).toBeGreaterThan(0)
  expect(english.encoded).toBe(0)
  expect(entries).toHaveLength(1)
  expect(german.image).toMatchObject({ alt: "Ein Foto", caption: "Bildunterschrift" })
  expect(english.image.alt).toBe("A photo")
  expect(english.image.caption).toBeUndefined()
  expect(english.image.families).toStrictEqual(german.image.families)
  expect(english.assets).toStrictEqual(german.assets)
  const cached = JSON.parse(
    fs.readFileSync(path.join(root, "node_modules/.cache/ardo/images", entries[0]!), "utf8")
  ) as { image: Record<string, unknown> }
  expect(cached.image).not.toHaveProperty("alt")
  expect(cached.image).not.toHaveProperty("caption")
})
