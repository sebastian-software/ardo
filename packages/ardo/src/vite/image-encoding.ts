import fs from "node:fs/promises"
import type encodeJxl from "@jsquash/jxl/encode.js"
import type { ImageFormatSource } from "../publication/types"
import sharp, { type OutputInfo } from "sharp"

export type ImageRaster = { data: Buffer; info: OutputInfo }
export type AdditionalImageFormat = ImageFormatSource["format"]
let jxlEncoder: Promise<typeof encodeJxl> | undefined

/** The WASM binary is an installed build dependency; encoding never fetches it at runtime. */
async function loadJxlEncoder() {
  const { default: encode, init } = await import("@jsquash/jxl/encode.js")
  const file = new URL(import.meta.resolve("@jsquash/jxl/codec/enc/jxl_enc.wasm"))
  const module = await WebAssembly.compile(new Uint8Array(await fs.readFile(file)))
  await init({
    instantiateWasm(
      imports: WebAssembly.Imports,
      receiveInstance: (instance: WebAssembly.Instance) => void
    ) {
      const instance = new WebAssembly.Instance(module, imports)
      receiveInstance(instance)
      return instance.exports
    },
  })
  return encode
}

export async function encodeImage(raster: ImageRaster, format: AdditionalImageFormat | "webp") {
  if (format === "jxl") {
    const encode = await (jxlEncoder ??= loadJxlEncoder())
    const image = {
      data: new Uint8ClampedArray(raster.data),
      width: raster.info.width,
      height: raster.info.height,
      colorSpace: "srgb" as const,
    }
    return Buffer.from(await encode(image, { quality: 82, effort: 5, progressive: true }))
  }
  const pipeline = sharp(raster.data, {
    raw: { width: raster.info.width, height: raster.info.height, channels: raster.info.channels },
  })
  return (
    format === "avif" ? pipeline.avif({ quality: 55, effort: 4 }) : pipeline.webp({ quality: 82 })
  ).toBuffer()
}

export function additionalImageFormats(configured: unknown): AdditionalImageFormat[] {
  if (configured == null) return ["jxl", "avif"]
  if (!Array.isArray(configured) || new Set(configured).size !== configured.length)
    throw invalidFormats()
  return configured.map((format) => {
    if (format === "jxl" || format === "avif") return format
    throw invalidFormats()
  })
}

function invalidFormats(): Error {
  return new Error(
    'publication.images.formats must contain unique "jxl" or "avif" entries; WebP is always the fallback.'
  )
}
