import { createHash } from "node:crypto"

import type { ImagePreset, PostImage } from "../images/types"
import type { ImageAsset, ImageInput } from "./image-pipeline"

import { buildCacheKey, getBuildCache } from "./build-cache"

/** A rendered image without the descriptive fields each reference supplies. */
type SharedImage = Omit<PostImage, "alt" | "caption">
type RasterResult = { image: SharedImage; assets: ImageAsset[] }
type CachedRaster = { image: SharedImage; assets: Array<{ fileName: string; data: string }> }

/** One image is often prepared for a page, a feed, and a listing within the same build. */
const rasterResults = new Map<string, Promise<RasterResult>>()

/**
 * Encoding is the most expensive step per image. The result depends only on the source bytes and
 * the options, so an unchanged image reuses its renditions from this process or the build cache.
 */
export async function cachedRasterImage(
  source: Buffer,
  context: ImageInput & { preset: ImagePreset },
  render: (assets: Map<string, ImageAsset>) => Promise<PostImage>
): Promise<PostImage> {
  const key = rasterImageKey(source, context)
  let result = rasterResults.get(key)
  if (result == null) {
    result = loadRasterImage(key, { root: context.root, render })
    rasterResults.set(key, result)
    result.catch(() => rasterResults.delete(key))
  }
  const { image, assets } = await result
  for (const asset of assets) context.assets.set(asset.fileName, asset)
  // Callers own their image description, as they did when every call rendered anew. The shared
  // renditions carry no description; each caller adds its own alt text and caption.
  return { alt: context.image.alt, caption: context.image.caption, ...structuredClone(image) }
}

/**
 * Only what changes the written files: the source bytes (which stand in for the path, so a moved
 * or shared file stays cached), the crop inputs, the resolved preset (it picks the fallback
 * composition), the rendition widths, the URL base, and whether a JPEG fallback is written.
 * Encoder formats and quality are fixed per Ardo and Sharp version, which every key includes.
 * Alt text, caption, and the page that references the image are left out, so language versions
 * of a post share one entry.
 */
export function rasterImageKey(
  source: Buffer,
  context: Pick<ImageInput, "image" | "base" | "config" | "jpegFallback"> & {
    preset: ImagePreset
  }
): string {
  const { core, frame, margin } = context.image
  return buildCacheKey("image", createHash("sha256").update(source).digest("hex"), {
    core,
    frame,
    margin,
    preset: context.preset,
    widths: context.config?.widths,
    base: context.base,
    jpegFallback: context.jpegFallback,
  })
}

async function loadRasterImage(
  key: string,
  input: { root: string; render: (assets: Map<string, ImageAsset>) => Promise<PostImage> }
): Promise<RasterResult> {
  const cache = getBuildCache(input.root)
  const cached = cache?.read<CachedRaster>("images", key)
  if (cached != null)
    return {
      image: cached.image,
      assets: cached.assets.map(({ fileName, data }) => ({
        fileName,
        source: Buffer.from(data, "base64"),
      })),
    }
  const assets = new Map<string, ImageAsset>()
  const { alt: _alt, caption: _caption, ...image } = await input.render(assets)
  const rendered = [...assets.values()]
  cache?.write("images", key, {
    image,
    assets: rendered.map(({ fileName, source }) => ({ fileName, data: source.toString("base64") })),
  } satisfies CachedRaster)
  return { image, assets: rendered }
}
