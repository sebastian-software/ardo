import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import sharp from "sharp"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ImageProvider } from "../images/types"
import { hasGpsMetadata } from "./image-metadata"
import { preparePostImage, type ImageAsset } from "./post-images"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})
async function input() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-provider-"))
  roots.push(root)
  const source = await sharp({ create: { width: 64, height: 40, channels: 3, background: "red" } })
    .png()
    .toBuffer()
  await fs.writeFile(path.join(root, "photo.png"), source)
  return {
    root,
    source,
    sourceFile: path.join(root, "post.md"),
    base: "/project/",
    assets: new Map<string, ImageAsset>(),
    image: { src: "./photo.png", alt: "A scene" },
  }
}
function provider() {
  return {
    source: vi.fn(({ sha256, extension }: { sha256: string; extension: string }) => ({
      fileName: `images/${sha256}.${extension}`,
      url: `https://cdn.example.test/images/${sha256}.${extension}`,
    })),
    url: vi.fn(
      ({
        source,
        width,
        height,
        crop,
        kind,
      }: Parameters<ImageProvider["url"]>[0]): ReturnType<ImageProvider["url"]> => ({
        url: `${source}?crop=${crop.width},${crop.height},${crop.left},${crop.top}&width=${width}&height=${height}&kind=${kind}`,
        type: kind === "fallback" ? "image/jpeg" : "image/webp",
      })
    ),
  }
}
it("emits one original with its full hash and delegates oriented crop URLs and MIME", async () => {
  const context = await input()
  const delivery = provider()
  const config = { widths: [16, 32], provider: delivery }
  const result = await preparePostImage({ ...context, config })
  await preparePostImage({ ...context, config, jpegFallback: false })
  const hash = createHash("sha256").update(context.source).digest("hex")
  expect(delivery.source).toHaveBeenCalledTimes(1)
  expect(delivery.source).toHaveBeenCalledWith(
    expect.objectContaining({
      sha256: hash,
      extension: "png",
      width: 64,
      height: 40,
      orientation: 1,
    })
  )
  expect([...context.assets.keys()]).toStrictEqual([`images/${hash}.png`])
  expect(context.assets.get(`images/${hash}.png`)?.source).toStrictEqual(context.source)
  expect(result.families[0]).toMatchObject({
    type: "image/webp",
    renditions: [
      { src: expect.stringContaining("https://cdn.example.test/"), width: 16, height: 10 },
      { src: expect.any(String), width: 32, height: 20 },
    ],
  })
  expect(result.fallback).toMatchObject({
    src: expect.stringContaining("kind=fallback"),
    width: 64,
    height: 40,
  })
})
it("rejects an original path outside image output before emitting it", async () => {
  const context = await input()
  const delivery = provider()
  delivery.source.mockReturnValue({
    fileName: "../escape.png",
    url: "https://cdn.example.test/original.png",
  })
  await expect(preparePostImage({ ...context, config: { provider: delivery } })).rejects.toThrow(
    "fileName"
  )
  expect(context.assets.size).toBe(0)
})
it("rejects inconsistent family formats and unsuitable feed fallbacks", async () => {
  const context = await input()
  const delivery = provider()
  delivery.url.mockImplementation(inconsistentUrl)
  await expect(
    preparePostImage({ ...context, config: { widths: [16, 32], provider: delivery } })
  ).rejects.toThrow("same MIME")
  await expect(
    preparePostImage({ ...context, config: { widths: [16], provider: delivery } })
  ).rejects.toThrow("fallback")
})

it("plans exact crops in EXIF-oriented pixels while emitting the original bytes", async () => {
  const context = await input()
  const original = await sharp({
    create: { width: 40, height: 64, channels: 3, background: "red" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  await fs.writeFile(path.join(context.root, "photo.png"), original)
  const delivery = provider()
  await preparePostImage({
    ...context,
    image: { ...context.image, core: { x: 0.5, y: 0.5, size: 0.2 } },
    config: { widths: [16], provider: delivery },
  })
  expect(delivery.source).toHaveBeenCalledWith(
    expect.objectContaining({
      sha256: createHash("sha256").update(original).digest("hex"),
      extension: "jpg",
      width: 64,
      height: 40,
      orientation: 6,
    })
  )
  expect(delivery.url).toHaveBeenCalledWith(
    expect.objectContaining({
      crop: { left: 20, top: 13, width: 24, height: 15 },
      width: 16,
      height: 10,
      kind: "rendition",
    })
  )
  expect([...context.assets.values()][0].source).toStrictEqual(original)
})
it("rejects unsafe or relative URLs without including credentials in its errors", async () => {
  const context = await input()
  const delivery = provider()
  delivery.source.mockReturnValue({
    fileName: "images/photo.png",
    url: "https://secret:password@cdn.example.test/photo.png",
  })
  let message = ""
  try {
    await preparePostImage({ ...context, config: { provider: delivery } })
  } catch (error) {
    message = String(error)
  }
  expect(message).toContain("without credentials")
  expect(message).not.toContain("password")
  expect(context.assets.size).toBe(0)
  delivery.source.mockReturnValue({ fileName: "images/photo.png", url: "photo.png" })
  await expect(preparePostImage({ ...context, config: { provider: delivery } })).rejects.toThrow(
    "absolute HTTP"
  )
})
it.each([
  ["protocol-relative", "//cdn.example.test/photo.png"],
  ["backslash host", "/\\cdn.example.test/photo.png"],
  ["space in a path", "/images/my photo.png"],
  ["unnormalized host", "https://CDN.example.test/photo.png"],
  ["raw space", "https://cdn.example.test/my photo.png"],
  ["trailing comma", "https://cdn.example.test/photo.png,"],
])("rejects a provider URL that would break srcset or leave the site: %s", async (_label, url) => {
  const context = await input()
  const delivery = provider()
  delivery.source.mockReturnValue({ fileName: "images/photo.png", url })
  await expect(preparePostImage({ ...context, config: { provider: delivery } })).rejects.toThrow(
    "Image provider URLs must be"
  )
})
it("passes the deployment base and keeps a root-relative provider URL", async () => {
  const context = await input()
  const delivery = provider()
  delivery.source.mockImplementation(({ sha256, extension }) => ({
    fileName: `images/${sha256}.${extension}`,
    url: `/project/images/${sha256}.${extension}`,
  }))
  delivery.url.mockImplementation(({ source, width }) => ({
    url: `${source}?width=${width}`,
    type: "image/jpeg",
  }))
  const image = await preparePostImage({ ...context, config: { provider: delivery } })
  expect(delivery.source).toHaveBeenCalledWith(expect.objectContaining({ base: "/project/" }))
  expect(image.fallback?.src).toMatch(/^\/project\/images\/[\da-f]{64}\.png\?width=\d+$/u)
})
const png = () => sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png()
function exifBlock(order: "II" | "MM", tag: number): Buffer {
  const le = order === "II"
  const block = Buffer.alloc(32)
  block.write("Exif", 0, "latin1")
  block.write(order, 6, "latin1")
  const offset = (position: number, value: number) =>
    le ? block.writeUInt32LE(value, position) : block.writeUInt32BE(value, position)
  const short = (position: number, value: number) =>
    le ? block.writeUInt16LE(value, position) : block.writeUInt16BE(value, position)
  short(8, 42)
  offset(10, 8)
  short(14, 1)
  short(16, tag)
  return block
}
describe("GPS metadata in originals", () => {
  it("finds the GPS pointer in sharp's EXIF output", async () => {
    const tagged = await png()
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "48/1 8/1 0/1" } })
      .toBuffer()
    expect(hasGpsMetadata(await sharp(tagged).metadata())).toBe(true)
    expect(hasGpsMetadata(await sharp(await png().toBuffer()).metadata())).toBe(false)
  })
  it("reads both byte orders, XMP, and tolerates truncated EXIF", () => {
    expect(hasGpsMetadata({ exif: exifBlock("II", 0x88_25) })).toBe(true)
    expect(hasGpsMetadata({ exif: exifBlock("MM", 0x88_25) })).toBe(true)
    expect(hasGpsMetadata({ exif: exifBlock("II", 0x01_10) })).toBe(false)
    expect(hasGpsMetadata({ exif: exifBlock("II", 0x88_25).subarray(0, 12) })).toBe(false)
    expect(hasGpsMetadata({ xmp: Buffer.from('exif:GPSLatitude="48,8N"') })).toBe(true)
    expect(hasGpsMetadata({ xmp: Buffer.from('dc:title="GPS"') })).toBe(false)
  })
  it("marks only the original that publishes a location", async () => {
    const context = await input()
    const tagged = await sharp(context.source)
      .jpeg()
      .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "48/1 8/1 0/1" } })
      .toBuffer()
    await fs.writeFile(path.join(context.root, "located.jpg"), tagged)
    const delivery = provider()
    const config = { provider: delivery }
    await preparePostImage({ ...context, config })
    await preparePostImage({
      ...context,
      config,
      image: { src: "./located.jpg", alt: "A place" },
    })
    expect([...context.assets.values()].map((asset) => asset.gpsSource)).toStrictEqual([
      undefined,
      "located.jpg",
    ])
  })
})

function inconsistentUrl({
  source,
  width,
  kind,
}: Parameters<ImageProvider["url"]>[0]): ReturnType<ImageProvider["url"]> {
  return {
    url: `${source}?width=${width}`,
    type: kind === "fallback" ? "image/avif" : width === 16 ? "image/webp" : "image/jpeg",
  }
}
