import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import sharp, { type Metadata, type OutputInfo } from "sharp"
import type {
  ImageComposition,
  ImageCropFamily,
  ImagePreset,
  PostImage,
  PostImageInput,
  ImagesConfig,
} from "../images/types"
import { cachedRasterImage } from "./image-cache"
import { renderProviderImage } from "./image-provider"
import { ardoImagePresets } from "../images/presets"
import { calculateImageCrop, type CropRectangle } from "./image-framing"

export { calculateImageCrop } from "./image-framing"

export type ImageAsset = {
  fileName: string
  source: Buffer
  /** The source image, when this unchanged original would publish its GPS location. */
  gpsSource?: string
}
export type ImageInput = {
  image: PostImageInput
  sourceFile: string
  root: string
  base: string
  config?: ImagesConfig
  assets: Map<string, ImageAsset>
  dependencies?: Set<string>
  /** Author portraits are used directly as AVIF and do not need an export image. */
  jpegFallback?: boolean
}
type ImageContext = ImageInput & { preset: ImagePreset }
type Composition = { composition: ImageComposition; crop: CropRectangle }
type Raster = { data: Buffer; info: OutputInfo }

export async function prepareImage(input: ImageInput): Promise<PostImage> {
  const { image } = input
  if (typeof image.src !== "string" || typeof image.alt !== "string")
    throw new TypeError(
      "Post images require src and alt strings (use an empty alt for decorative images)."
    )
  const preset = readPreset(input)
  const context = { ...input, preset }
  if (/^(?:https?:)?\/\//iu.test(image.src)) return remoteImage(context)
  const file = imageFile(input)
  input.dependencies?.add(file)
  try {
    const source = await fs.readFile(file)
    const metadata = await sharp(source).metadata()
    if (context.config?.provider != null)
      return prepareProviderSource({ source, metadata, file }, context)
    return metadata.format === "svg" || (metadata.pages ?? 1) > 1
      ? passthroughImage({ source, metadata, file }, context)
      : await cachedRasterImage(source, context, (assets) =>
          rasterImage(source, { ...context, assets })
        )
  } catch (error) {
    throw new Error(
      `[ardo] Image ${file} in ${input.sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
}

/** A prepared share image keeps its size and format; orientation is applied and metadata dropped. */
export async function prepareShareImage(
  input: Pick<ImageInput, "sourceFile" | "root" | "base" | "assets" | "dependencies"> & {
    src: string
  }
): Promise<string> {
  const file = imageFile({ ...input, image: { src: input.src, alt: "" } })
  input.dependencies?.add(file)
  try {
    const source = await fs.readFile(file)
    const { format } = await sharp(source).metadata()
    if (format !== "jpeg" && format !== "png") throw new Error("Share images must be JPEG or PNG.")
    const image = sharp(source).autoOrient()
    const output = await (format === "png" ? image.png() : image.jpeg({ quality: 90 })).toBuffer()
    return storeImage(output, input, format === "png" ? "png" : "jpg")
  } catch (error) {
    throw new Error(
      `[ardo] Image ${file} in ${input.sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
}

function prepareProviderSource(
  input: { source: Buffer; metadata: Metadata; file: string },
  context: ImageContext
): PostImage {
  const { metadata } = input
  const swap = (metadata.orientation ?? 1) >= 5
  const width = (swap ? metadata.height : metadata.width) ?? 0
  const height = (swap ? metadata.width : metadata.height) ?? 0
  if (width <= 0 || height <= 0) throw new Error("Image dimensions are unavailable.")
  const passthrough = metadata.format === "svg" || (metadata.pages ?? 1) > 1
  if (passthrough && (context.image.core != null || context.image.frame != null))
    throw new Error("Framing SVG or animated images is unsupported; use a still raster image.")
  const plan = passthrough ? undefined : createImagePlan(context, { width, height })
  return renderProviderImage({ ...input, width, height, plan, context })
}

function imageFile(input: ImageInput): string {
  if (/^[a-z][\d+.a-z-]*:/iu.test(input.image.src) || /[?#]/u.test(input.image.src))
    throw new Error(`Expected a local image path or an HTTP URL: ${input.image.src}`)
  return input.image.src.startsWith("/")
    ? path.join(input.root, "public", decodeURIComponent(input.image.src))
    : path.resolve(path.dirname(input.sourceFile), decodeURIComponent(input.image.src))
}

function remoteImage(context: ImageContext): PostImage {
  if (context.image.core != null || context.image.frame != null)
    throw new Error("Framing metadata is supported only for local images.")
  return {
    alt: context.image.alt,
    caption: context.image.caption,
    preset: context.preset,
    families: [
      { composition: "original", renditions: [{ src: context.image.src, width: 0, height: 0 }] },
    ],
  }
}

function passthroughImage(
  input: { source: Buffer; metadata: Metadata; file: string },
  context: ImageContext
): PostImage {
  if (context.image.core != null || context.image.frame != null)
    throw new Error("Framing SVG or animated images is unsupported; use a still raster image.")
  const src = storeImage(input.source, context, path.extname(input.file).slice(1))
  return {
    alt: context.image.alt,
    caption: context.image.caption,
    preset: context.preset,
    families: [
      {
        composition: "original",
        renditions: [{ src, width: input.metadata.width ?? 0, height: input.metadata.height ?? 0 }],
      },
    ],
  }
}

async function rasterImage(source: Buffer, context: ImageContext): Promise<PostImage> {
  // Raw pixels avoid a lossy intermediate JPEG encode after EXIF orientation.
  const raster = await sharp(source).autoOrient().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = raster.info
  const plan = createImagePlan(context, { width, height })
  const families: ImageCropFamily[] = []
  for (const family of plan.families)
    families.push(await renderFamily({ raster, ...family }, context))
  return {
    alt: context.image.alt,
    caption: context.image.caption,
    preset: context.preset,
    families,
    ...(context.jpegFallback === false
      ? {}
      : { fallback: await renderJpeg({ raster, ...plan.fallback }, context) }),
  }
}

export type ImagePlan = {
  families: Array<Composition & { widths: number[] }>
  fallback: Composition
}

/** Composition planning has no encoder or delivery-provider effects. */
export function createImagePlan(
  context: ImageContext,
  size: { width: number; height: number }
): ImagePlan {
  const { width, height } = size
  const framed = context.image.core != null || context.image.frame != null
  const compositions: Composition[] = framed
    ? framedCompositions(context.image, size)
    : [{ composition: "original", crop: { left: 0, top: 0, width, height } }]
  if (
    framed &&
    [
      context.preset.fallback,
      ...(context.preset.sources ?? []).map((entry) => entry.composition),
    ].includes("original")
  )
    throw new Error(
      "A framed image preset must select 16:10 or 4:3; the original is not generated."
    )
  const fallback = compositions.find(
    (entry) => entry.composition === "original" || entry.composition === context.preset.fallback
  )
  if (fallback == null)
    throw new Error(`Image preset requests unavailable composition ${context.preset.fallback}.`)
  return {
    families: compositions.map((entry) => ({
      ...entry,
      widths: renditionWidths(context.config?.widths, entry.crop.width),
    })),
    fallback,
  }
}

function framedCompositions(
  image: PostImageInput,
  size: { width: number; height: number }
): Composition[] {
  return (
    [
      ["16:10", [8, 5]],
      ["4:3", [4, 3]],
    ] as const
  ).map(([composition, ratio]) => {
    try {
      return {
        composition,
        crop: calculateImageCrop({
          ...size,
          ratio,
          core: image.core,
          frame: image.frame,
          margin: image.margin,
        }),
      }
    } catch (error) {
      throw new Error(`${composition}: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      })
    }
  })
}

async function renderFamily(
  input: Composition & { raster: Raster; widths: number[] },
  context: ImageContext
): Promise<ImageCropFamily> {
  const { crop, raster } = input
  const renditions = []
  for (const width of input.widths) {
    const output = await sharp(raster.data, {
      raw: { width: raster.info.width, height: raster.info.height, channels: raster.info.channels },
    })
      .extract(crop)
      .resize({ width, withoutEnlargement: true })
      .toColourspace("srgb")
      .avif({ quality: 55, effort: 4 })
      .toBuffer({ resolveWithObject: true })
    renditions.push({
      src: storeImage(output.data, context, "avif"),
      width: output.info.width,
      height: output.info.height,
    })
  }
  return { composition: input.composition, renditions }
}

async function renderJpeg(
  { raster, crop }: Composition & { raster: Raster },
  context: ImageContext
) {
  const output = await sharp(raster.data, {
    raw: { width: raster.info.width, height: raster.info.height, channels: raster.info.channels },
  })
    .extract(crop)
    .resize({ width: 1280, withoutEnlargement: true })
    .toColourspace("srgb")
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
  return {
    src: storeImage(output.data, context, "jpg"),
    width: output.info.width,
    height: output.info.height,
  }
}

function renditionWidths(configured: number[] | undefined, max: number): number[] {
  const widths = configured ?? [384, 640, 960, 1280, 1920]
  if (
    widths.length === 0 ||
    widths.some((value) => !Number.isInteger(value) || value <= 0 || value > 8192)
  )
    throw new Error("Image widths must be positive integers no greater than 8192.")
  return [
    ...new Set([...widths.filter((value) => value <= max), Math.min(max, Math.max(...widths))]),
  ].sort((a, b) => a - b)
}

function storeImage(
  source: Buffer,
  context: Pick<ImageInput, "assets" | "base">,
  extension: string
): string {
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 20)
  const fileName = `assets/posts/${hash}.${extension}`
  context.assets.set(fileName, { fileName, source })
  return `${context.base}${fileName}`
}

function validComposition(composition: unknown): boolean {
  return composition === "original" || composition === "16:10" || composition === "4:3"
}
function readPreset(input: ImageInput): ImagePreset {
  const preset = { ...ardoImagePresets, ...input.config?.presets }[input.image.preset ?? "article"]
  if (preset == null) throw new Error(`Unknown image preset ${JSON.stringify(input.image.preset)}.`)
  if (
    !validComposition(preset.fallback) ||
    typeof preset.sizes !== "string" ||
    preset.sizes === "" ||
    preset.sources?.some(
      (source) => typeof source.media !== "string" || !validComposition(source.composition)
    )
  )
    throw new Error(
      "Image presets require a valid fallback, sizes, and valid ordered media sources."
    )
  return preset
}
