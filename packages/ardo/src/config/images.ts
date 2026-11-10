import type { ImagesConfig } from "../images/types"

export function validateImagesConfig(images: ImagesConfig | undefined): void {
  if (images === undefined) return
  if (images == null || typeof images !== "object" || Array.isArray(images))
    throw new Error("[ardo] images must be an object.")
  if (
    images.widths != null &&
    (!Array.isArray(images.widths) ||
      images.widths.length === 0 ||
      images.widths.some((width) => !Number.isInteger(width) || width <= 0 || width > 8192))
  )
    throw new Error("[ardo] Image widths must be positive integers no greater than 8192.")
  if (
    images.provider != null &&
    (typeof images.provider !== "object" ||
      typeof images.provider.source !== "function" ||
      typeof images.provider.url !== "function")
  )
    throw new Error("[ardo] images.provider needs synchronous source and url functions.")
}

/** The top-level values override the compatible publication defaults, field by field. */
export function resolveImagesConfig(
  images: ImagesConfig | undefined,
  legacy?: ImagesConfig
): ImagesConfig | undefined {
  if (images === undefined) return legacy
  return {
    ...legacy,
    ...images,
    ...(legacy?.presets == null && images.presets == null
      ? {}
      : { presets: { ...legacy?.presets, ...images.presets } }),
  }
}
