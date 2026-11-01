import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterEach, expect, it } from "vitest"
import { preparePostImage, type ImageAsset } from "./post-images"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function input(width = 96, height = 72) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-image-formats-"))
  roots.push(root)
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 80, g: 120, b: 180, alpha: 0.5 },
    },
  })
    .png()
    .toFile(path.join(root, "photo.png"))
  return {
    root,
    sourceFile: path.join(root, "post.mdx"),
    base: "/project/",
    assets: new Map<string, ImageAsset>(),
    image: { src: "./photo.png", alt: "A translucent scene" },
  }
}

it("encodes responsive AVIF crops with transparency and one opaque JPEG in the default composition", async () => {
  const context = await input()
  const image = await preparePostImage({
    ...context,
    image: { ...context.image, core: { x: 0.5, y: 0.5, size: 0.4 } },
    config: { widths: [16, 32] },
  })
  expect(image.families.map((family) => family.composition)).toStrictEqual(["16:10", "4:3"])
  const getBytes = (src: string) => context.assets.get(src.slice(context.base.length))!.source
  for (const family of image.families) {
    expect(family.renditions).toHaveLength(2)
    for (const rendition of family.renditions) {
      expect(rendition.src).toMatch(/\.avif$/u)
      expect(rendition.width).toBeLessThanOrEqual(32)
      expect(await sharp(getBytes(rendition.src)).metadata()).toMatchObject({
        width: rendition.width,
        height: rendition.height,
        format: "heif",
        compression: "av1",
        hasAlpha: true,
      })
      const avifPixels = await sharp(getBytes(rendition.src)).ensureAlpha().raw().toBuffer()
      expect(avifPixels[3]).toBeGreaterThan(0)
      expect(avifPixels[3]).toBeLessThan(255)
    }
  }
  expect([...context.assets.keys()].filter((file) => file.endsWith(".jpg"))).toHaveLength(1)
  const jpeg = image.fallback!
  expect(jpeg.src).toMatch(/\.jpg$/u)
  expect(jpeg.width).toBeLessThanOrEqual(96)
  expect(jpeg.width * 3).toBe(jpeg.height * 4)
  expect(await sharp(getBytes(jpeg.src)).metadata()).toMatchObject({
    width: jpeg.width,
    height: jpeg.height,
    format: "jpeg",
    hasAlpha: false,
  })
  const pixels = await sharp(getBytes(jpeg.src)).raw().toBuffer()
  for (const [channel, expected] of [168, 188, 218].entries())
    expect(Math.abs(pixels[channel] - expected)).toBeLessThan(5)
})

it("caps the single JPEG at 1280px independently of AVIF widths and follows the authored preset", async () => {
  const context = await input(2200, 1400)
  const image = await preparePostImage({
    ...context,
    image: {
      ...context.image,
      frame: { x: 0, y: 0, width: 1, height: 1 },
      preset: "wide",
    },
    config: {
      widths: [64],
      presets: { wide: { fallback: "16:10", sizes: "100vw" } },
    },
  })
  expect(image.fallback).toMatchObject({ width: 1280, height: 800 })
  expect(image.families.flatMap((family) => family.renditions).every((r) => r.width === 64)).toBe(
    true
  )
  expect([...context.assets.keys()].filter((file) => file.endsWith(".jpg"))).toHaveLength(1)
})

it("does not create an unused JPEG for AVIF author portraits", async () => {
  const context = await input()
  const image = await preparePostImage({ ...context, jpegFallback: false })
  expect(image.fallback).toBeUndefined()
  expect([...context.assets.keys()].every((file) => file.endsWith(".avif"))).toBe(true)
})

it("keeps SVG and external images as a single untouched source", async () => {
  const context = await input()
  await fs.writeFile(
    path.join(context.root, "icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20"/></svg>'
  )
  const svg = await preparePostImage({ ...context, image: { src: "./icon.svg", alt: "Icon" } })
  expect(svg.families[0].renditions[0].src).toMatch(/\.svg$/u)
  expect(svg.fallback).toBeUndefined()
  const remote = await preparePostImage({
    ...context,
    image: { src: "https://example.test/photo.png", alt: "Remote" },
  })
  expect(remote.families[0].renditions[0].src).toBe("https://example.test/photo.png")
  expect(remote.fallback).toBeUndefined()
})
