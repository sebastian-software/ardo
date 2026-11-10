import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import sharp from "sharp"
import { afterEach, expect, it, vi } from "vitest"
import type { ImageProvider } from "../images/types"
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
  delivery.source.mockReturnValue({ fileName: "images/photo.png", url: "/photo.png" })
  await expect(preparePostImage({ ...context, config: { provider: delivery } })).rejects.toThrow(
    "absolute HTTP"
  )
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
