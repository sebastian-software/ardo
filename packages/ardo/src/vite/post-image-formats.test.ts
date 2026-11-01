import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import decodeJxl, { init } from "@jsquash/jxl/decode.js"
import sharp from "sharp"
import { afterEach, expect, it } from "vitest"
import { additionalImageFormats } from "./image-encoding"
import { preparePostImage, type ImageAsset } from "./post-images"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true })
})

async function input() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-image-formats-"))
  roots.push(root)
  await sharp({
    create: {
      width: 96,
      height: 72,
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

it("encodes both crops at matching sizes in JPEG XL, AVIF, and WebP without losing transparency", async () => {
  const module = await WebAssembly.compile(
    new Uint8Array(
      await fs.readFile(new URL(import.meta.resolve("@jsquash/jxl/codec/dec/jxl_dec.wasm")))
    )
  )
  await init({
    instantiateWasm(
      imports: WebAssembly.Imports,
      receive: (instance: WebAssembly.Instance) => void
    ) {
      const instance = new WebAssembly.Instance(module, imports)
      receive(instance)
      return instance.exports
    },
  })
  const context = await input()
  const image = await preparePostImage({
    ...context,
    image: { ...context.image, core: { x: 0.5, y: 0.5, size: 0.4 } },
    config: { widths: [16, 32] },
  })
  expect(image.families.map((family) => family.composition)).toStrictEqual(["16:10", "4:3"])
  for (const family of image.families) {
    expect(family.formats?.map((source) => source.format)).toStrictEqual(["jxl", "avif"])
    const fallback = family.renditions
    const [jxlSource, avifSource] = family.formats!
    const jxl = jxlSource.renditions
    const avif = avifSource.renditions
    expect(jxl).toHaveLength(fallback.length)
    expect(avif).toHaveLength(fallback.length)
    for (const [index, rendition] of fallback.entries()) {
      const getBytes = (src: string) => context.assets.get(src.slice(context.base.length))!.source
      const dimensions = { width: rendition.width, height: rendition.height }
      expect(rendition.width).toBeLessThanOrEqual(32)
      expect(await sharp(getBytes(rendition.src)).metadata()).toMatchObject({
        ...dimensions,
        format: "webp",
        hasAlpha: true,
      })
      expect(jxl[index].src).toMatch(/\.jxl$/u)
      const decoded = await decodeJxl(Uint8Array.from(getBytes(jxl[index].src)).buffer)
      expect(decoded).toMatchObject(dimensions)
      expect(decoded.data[3]).toBeGreaterThan(0)
      expect(decoded.data[3]).toBeLessThan(255)
      expect(await sharp(getBytes(avif[index].src)).metadata()).toMatchObject({
        ...dimensions,
        format: "heif",
        compression: "av1",
        hasAlpha: true,
      })
    }
  }
})

it("honors optional encodings and can retain the WebP-only pipeline", async () => {
  const context = await input()
  const avifOnly = await preparePostImage({ ...context, config: { formats: ["avif"] } })
  expect(avifOnly.families[0].formats?.map((source) => source.format)).toStrictEqual(["avif"])
  expect([...context.assets.keys()].some((file) => file.endsWith(".jxl"))).toBe(false)
  const webpOnly = await preparePostImage({ ...context, config: { formats: [] } })
  expect(webpOnly.families[0].formats).toStrictEqual([])
  expect(webpOnly.families[0].renditions[0].src).toMatch(/\.webp$/u)
  expect(additionalImageFormats(["avif", "jxl"])).toStrictEqual(["avif", "jxl"])
  expect(() => additionalImageFormats(["jxl", "jxl"])).toThrow("unique")
  expect(() => additionalImageFormats(["jpeg"])).toThrow("formats")
})

it("keeps SVG and external images as a single untouched source", async () => {
  const context = await input()
  await fs.writeFile(
    path.join(context.root, "icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20"/></svg>'
  )
  const svg = await preparePostImage({ ...context, image: { src: "./icon.svg", alt: "Icon" } })
  expect(svg.families[0].renditions[0].src).toMatch(/\.svg$/u)
  expect(svg.families[0].formats).toBeUndefined()
  const remote = await preparePostImage({
    ...context,
    image: { src: "https://example.test/photo.png", alt: "Remote" },
  })
  expect(remote.families[0].renditions[0].src).toBe("https://example.test/photo.png")
  expect(remote.families[0].formats).toBeUndefined()
})
