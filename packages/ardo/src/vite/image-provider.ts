import { createHash } from "node:crypto"
import path from "node:path"
import type { Metadata } from "sharp"
import type { ImageCropFamily, ImageProvider, PostImage } from "../images/types"
import type { ImageInput, ImageAsset, ImagePlan } from "./image-pipeline"

type Source = ReturnType<ImageProvider["source"]>
const sources = new WeakMap<Map<string, ImageAsset>, WeakMap<ImageProvider, Map<string, Source>>>()

export function renderProviderImage(input: {
  source: Buffer
  metadata: Metadata
  file: string
  width: number
  height: number
  plan?: ImagePlan
  context: ImageInput & { preset: PostImage["preset"] }
}): PostImage {
  const { context, width, height, plan } = input
  const provider = context.config?.provider
  if (provider == null) throw new Error("Image provider is unavailable.")
  const original = originalSource(input, provider)
  if (plan == null)
    return {
      alt: context.image.alt,
      caption: context.image.caption,
      preset: context.preset,
      families: [{ composition: "original", renditions: [{ src: original.url, width, height }] }],
    }
  const families = plan.families.map((family): ImageCropFamily => {
    let type: ImageCropFamily["type"]
    const renditions = family.widths.map((renditionWidth) => {
      const rendition = providerRendition({
        provider,
        source: original.url,
        crop: family.crop,
        width: renditionWidth,
        kind: "rendition",
      })
      if (type != null && type !== rendition.type)
        throw new Error("Image provider renditions in one family must use the same MIME type.")
      type = rendition.type
      return {
        src: rendition.url,
        width: renditionWidth,
        height: targetHeight(family.crop, renditionWidth),
      }
    })
    return { composition: family.composition, type, renditions }
  })
  const fallbackWidth = Math.min(1280, plan.fallback.crop.width)
  const fallback =
    context.jpegFallback === false
      ? undefined
      : providerRendition({
          provider,
          source: original.url,
          crop: plan.fallback.crop,
          width: fallbackWidth,
          kind: "fallback",
        })
  return {
    alt: context.image.alt,
    caption: context.image.caption,
    preset: context.preset,
    families,
    ...(fallback == null
      ? {}
      : {
          fallback: {
            src: fallback.url,
            width: fallbackWidth,
            height: targetHeight(plan.fallback.crop, fallbackWidth),
          },
        }),
  }
}

function originalSource(
  input: Parameters<typeof renderProviderImage>[0],
  provider: ImageProvider
): Source {
  const { context, source, metadata, width, height } = input
  const cache = sourceCache(context.assets, provider)
  const sha256 = createHash("sha256").update(source).digest("hex")
  const cached = cache.get(sha256)
  if (cached != null) return cached
  const extension =
    metadata.format === "jpeg"
      ? "jpg"
      : metadata.format === "heif"
        ? metadata.compression === "av1"
          ? "avif"
          : "heic"
        : (metadata.format ?? path.extname(input.file).slice(1))
  const result = provider.source({
    sha256,
    extension,
    width,
    height,
    orientation: metadata.orientation ?? 1,
  })
  if (result == null || typeof result.fileName !== "string" || !validFileName(result.fileName))
    throw new Error(
      "Image provider.source fileName must be a relative image asset path without dot segments."
    )
  const url = publicUrl(result.url)
  const existing = context.assets.get(result.fileName)
  if (existing != null && !existing.source.equals(source))
    throw new Error("Image provider.source fileName collides with another image.")
  context.assets.set(result.fileName, { fileName: result.fileName, source })
  const resolved = { fileName: result.fileName, url }
  cache.set(sha256, resolved)
  return resolved
}

function sourceCache(
  assets: Map<string, ImageAsset>,
  provider: ImageProvider
): Map<string, Source> {
  let providers = sources.get(assets)
  if (providers == null) {
    providers = new WeakMap()
    sources.set(assets, providers)
  }
  let cache = providers.get(provider)
  if (cache == null) {
    cache = new Map()
    providers.set(provider, cache)
  }
  return cache
}

function validFileName(name: string): boolean {
  return (
    /^[\w.-]+(?:\/[\w.-]+)*\.(?:avif|png|jpe?g|webp|gif|svg|heic|tiff|jp2)$/iu.test(name) &&
    name.split("/").every((part) => !part.startsWith("."))
  )
}
function publicUrl(value: unknown): string {
  if (typeof value === "string") {
    try {
      const url = new URL(value)
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.username === "" &&
        url.password === ""
      )
        return value
    } catch {
      /* Report the contract, never a possibly credential-bearing value. */
    }
  }
  throw new Error("Image provider URLs must be absolute HTTP(S) URLs without credentials.")
}
function providerRendition({
  provider,
  source,
  crop,
  width,
  kind,
}: {
  provider: ImageProvider
  source: string
  crop: NonNullable<Parameters<typeof renderProviderImage>[0]["plan"]>["fallback"]["crop"]
  width: number
  kind: "rendition" | "fallback"
}) {
  const result = provider.url({
    source,
    crop: { ...crop },
    width,
    height: targetHeight(crop, width),
    kind,
  })
  if (
    result == null ||
    !["image/avif", "image/webp", "image/jpeg", "image/png"].includes(result.type)
  )
    throw new Error("Image provider.url needs an image MIME type.")
  if (kind === "fallback" && result.type !== "image/jpeg" && result.type !== "image/png")
    throw new Error("Image provider fallback must use JPEG or PNG for feeds and social images.")
  return { url: publicUrl(result.url), type: result.type }
}
function targetHeight(crop: { width: number; height: number }, width: number): number {
  return Math.max(1, Math.round((width * crop.height) / crop.width))
}
