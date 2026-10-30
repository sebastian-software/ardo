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
  PublicationConfig,
} from "../publication/types"
import { ardoImagePresets } from "../publication/presets"
import { calculateImageCrop, type CropRectangle } from "./image-framing"

export { calculateImageCrop } from "./image-framing"

export type ImageAsset = { fileName: string; source: Buffer }
type ImageInput = {
  image: PostImageInput
  sourceFile: string
  root: string
  base: string
  config?: PublicationConfig["images"]
  assets: Map<string, ImageAsset>
  dependencies?: Set<string>
}
type ImageContext = ImageInput & { preset: ImagePreset }
type Composition = { composition: ImageComposition; crop: CropRectangle }
type Raster = { data: Buffer; info: OutputInfo }

export async function preparePostImage(input: ImageInput): Promise<PostImage> {
  const { image } = input
  if (typeof image.src !== "string" || typeof image.alt !== "string")
    throw new Error(
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
    return metadata.format === "svg" || (metadata.pages ?? 1) > 1
      ? passthroughImage({ source, metadata, file }, context)
      : await rasterImage(source, context)
  } catch (error) {
    throw new Error(
      `[ardo] Image ${file} in ${input.sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
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
  const framed = context.image.core != null || context.image.frame != null
  const compositions: Composition[] = framed
    ? framedCompositions(context.image, { width, height })
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
  const families: ImageCropFamily[] = []
  for (const composition of compositions)
    families.push(await renderFamily({ raster, ...composition }, context))
  return {
    alt: context.image.alt,
    caption: context.image.caption,
    preset: context.preset,
    families,
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
  input: Composition & { raster: Raster },
  context: ImageContext
): Promise<ImageCropFamily> {
  const { crop, raster } = input
  const renditions = []
  for (const width of renditionWidths(context.config?.widths, crop.width)) {
    const output = await sharp(raster.data, {
      raw: { width: raster.info.width, height: raster.info.height, channels: raster.info.channels },
    })
      .extract(crop)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    renditions.push({
      src: storeImage(output.data, context),
      width: output.info.width,
      height: output.info.height,
    })
  }
  return { composition: input.composition, renditions }
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

function storeImage(source: Buffer, context: ImageContext, extension = "webp"): string {
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
