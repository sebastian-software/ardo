import { createHash } from "node:crypto"

import type { PostImage } from "../images/types"
import type { ImageAsset, ImageInput } from "./image-pipeline"

import { buildCacheKey, getBuildCache } from "./build-cache"

type RasterResult = { image: PostImage; assets: ImageAsset[] }
type CachedRaster = { image: PostImage; assets: Array<{ fileName: string; data: string }> }

/** One image is often prepared for a page, a feed, and a listing within the same build. */
const rasterResults = new Map<string, Promise<RasterResult>>()

/**
 * Encoding is the most expensive step per image. The result depends only on the source bytes and
 * the options, so an unchanged image reuses its renditions from this process or the build cache.
 */
export async function cachedRasterImage(
  source: Buffer,
  context: ImageInput,
  render: (assets: Map<string, ImageAsset>) => Promise<PostImage>
): Promise<PostImage> {
  const {
    assets: _assets,
    dependencies: _dependencies,
    sourceFile: _sourceFile,
    ...options
  } = context
  // The source bytes stand in for the path, so a moved or shared file stays cached.
  const key = buildCacheKey("image", createHash("sha256").update(source).digest("hex"), {
    ...options,
    image: { ...options.image, src: undefined },
  })
  let result = rasterResults.get(key)
  if (result == null) {
    result = loadRasterImage(key, { root: context.root, render })
    rasterResults.set(key, result)
    result.catch(() => rasterResults.delete(key))
  }
  const { image, assets } = await result
  for (const asset of assets) context.assets.set(asset.fileName, asset)
  // Callers own their image description, as they did when every call rendered anew.
  return structuredClone(image)
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
  const image = await input.render(assets)
  const rendered = [...assets.values()]
  cache?.write("images", key, {
    image,
    assets: rendered.map(({ fileName, source }) => ({ fileName, data: source.toString("base64") })),
  } satisfies CachedRaster)
  return { image, assets: rendered }
}
