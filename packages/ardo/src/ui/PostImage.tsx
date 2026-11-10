import type { ImgHTMLAttributes } from "react"
import type {
  ImageCropFamily,
  ImagePreset,
  ImageRendition,
  Post,
  PostImage,
} from "../publication/types"
import { useArdoPageData } from "../runtime/hooks"

export type ArdoImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  image?: PostImage
  preset?: ImagePreset
}

/** Select responsive AVIF compositions, with one JPEG for browsers needing a fallback. */
export function ArdoImage({
  image,
  preset,
  src,
  alt,
  loading = "lazy",
  decoding = "async",
  ...props
}: ArdoImageProps) {
  const page = useArdoPageData()
  const post = page?.frontmatter._ardoPost as Post | undefined
  const resolved = image ?? pageImage(src, post?.images, page?.images)
  if (resolved == null)
    return <img {...props} src={src} alt={alt} loading={loading} decoding={decoding} />
  const presentation = preset ?? resolved.preset
  const family = (composition: string) => {
    const original = resolved.families.find((entry) => entry.composition === "original")
    const selected =
      original ?? resolved.families.find((entry) => entry.composition === composition)
    if (selected == null)
      throw new Error(
        `[ardo] Image preset requests unavailable composition ${composition}; framed images provide 16:10 and 4:3.`
      )
    return selected
  }
  const fallback = family(presentation.fallback)
  const rendition = resolved.fallback ?? lastRendition(fallback.renditions)
  return (
    <picture>
      {presentation.sources?.map((source) => (
        <PictureSource
          key={`${source.media}-${source.composition}`}
          family={family(source.composition)}
          media={source.media}
          sizes={source.sizes ?? presentation.sizes}
          type={
            family(source.composition).type ??
            (resolved.fallback == null ? undefined : "image/avif")
          }
        />
      ))}
      {resolved.fallback != null && (
        <PictureSource
          family={fallback}
          sizes={props.sizes ?? presentation.sizes}
          type={fallback.type ?? "image/avif"}
        />
      )}
      <img
        {...props}
        src={rendition.src}
        srcSet={
          resolved.fallback == null ? (srcset(fallback.renditions) ?? props.srcSet) : props.srcSet
        }
        sizes={props.sizes ?? presentation.sizes}
        alt={alt ?? resolved.alt}
        width={rendition.width || props.width}
        height={rendition.height || props.height}
        loading={loading}
        decoding={decoding}
      />
    </picture>
  )
}

function PictureSource({
  family,
  media,
  sizes,
  type,
}: {
  family: ImageCropFamily
  media?: string
  sizes: string
  type?: string
}) {
  const candidate = lastRendition(family.renditions)
  return (
    <source
      type={type}
      media={media}
      srcSet={srcset(family.renditions)}
      sizes={sizes}
      width={candidate.width || undefined}
      height={candidate.height || undefined}
    />
  )
}

function srcset(renditions: ImageRendition[]): string | undefined {
  return renditions.some((entry) => entry.width === 0)
    ? undefined
    : renditions.map((entry) => `${entry.src} ${entry.width}w`).join(", ")
}

function lastRendition(renditions: ImageRendition[]): ImageRendition {
  const result = renditions.at(-1)
  if (result == null) throw new Error("[ardo] A responsive image needs at least one rendition.")
  return result
}

function pageImage(
  src: unknown,
  post?: Record<string, PostImage>,
  page?: Record<string, PostImage>
) {
  if (typeof src !== "string") return
  return post?.[src] ?? page?.[src]
}
