/** A square around the core subject. x/y are normalized center coordinates;
 * size is a fraction of the oriented source's shorter side. */
export type ImageCore = { x: number; y: number; size: number }

/** Desired frame, with normalized top-left coordinates and dimensions. */
export type ImageFrame = { x: number; y: number; width: number; height: number }
export type ImageComposition = "original" | "16:10" | "4:3"

export type ImagePreset = {
  /** The fallback composition. Unframed images always retain their composition. */
  fallback: ImageComposition
  sizes: string
  sources?: Array<{ media: string; composition: ImageComposition; sizes?: string }>
}

export type PostImageInput = {
  src: string
  alt: string
  caption?: string
  core?: ImageCore
  frame?: ImageFrame
  /** Desired margin per side, as a fraction of the resulting frame. Default: 0.15. */
  margin?: number
  preset?: string
}

export type ImageRendition = { src: string; width: number; height: number }
export type ImageCropFamily = {
  composition: ImageComposition
  /** Responsive resolutions, or the unchanged SVG/animated/remote source. */
  renditions: ImageRendition[]
  /** Provider MIME type. Absent preserves the default AVIF presentation. */
  type?: ImageMimeType
}
export type PostImage = {
  alt: string
  caption?: string
  preset: ImagePreset
  families: ImageCropFamily[]
  /** One JPEG in the default composition, at most 1280px wide, for fallback and exports. */
  fallback?: ImageRendition
}

/** Supported raster response formats. Feed fallbacks must be JPEG or PNG. */
export type ImageMimeType = "image/avif" | "image/webp" | "image/jpeg" | "image/png"

/** An exact rectangle in EXIF-oriented original pixels, before resizing. */
export type ImageCropRectangle = { left: number; top: number; width: number; height: number }

/** Deterministic, synchronous delivery hooks. Ardo emits originals; a site's deploy uploads them. */
export type ImageProvider = {
  source: (input: {
    /** SHA-256 of the original bytes, all 64 hexadecimal characters. */
    sha256: string
    extension: string
    /** Dimensions after applying EXIF orientation. */
    width: number
    height: number
    /** EXIF orientation of the original bytes. Apply it before the crop. */
    orientation: number
  }) => { fileName: string; url: string }
  url: (input: {
    source: string
    crop: ImageCropRectangle
    width: number
    height: number
    kind: "rendition" | "fallback"
  }) => { url: string; type: ImageMimeType }
}

/** Local image processing shared by publication images and opt-in Markdown/MDX pages. */
export type ImagesConfig = {
  widths?: number[]
  presets?: Record<string, ImagePreset>
  provider?: ImageProvider
}
