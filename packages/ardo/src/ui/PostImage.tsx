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

/** Render one composition per source, letting the browser select its resolution. */
export function ArdoImage({
  image,
  preset,
  src,
  alt,
  loading = "lazy",
  decoding = "async",
  ...props
}: ArdoImageProps) {
  const post = useArdoPageData()?.frontmatter._ardoPost as Post | undefined
  const resolved = image ?? (typeof src === "string" ? post?.images[src] : undefined)
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
  const rendition = lastRendition(fallback)
  return (
    <picture>
      {presentation.sources?.map((source) => {
        const crop = family(source.composition)
        const candidate = lastRendition(crop)
        return (
          <source
            key={`${source.media}-${source.composition}`}
            media={source.media}
            srcSet={srcset(crop)}
            sizes={source.sizes ?? presentation.sizes}
            width={candidate.width || undefined}
            height={candidate.height || undefined}
          />
        )
      })}
      <img
        {...props}
        src={rendition.src}
        srcSet={srcset(fallback) ?? props.srcSet}
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

function srcset(family: ImageCropFamily): string | undefined {
  return family.renditions.some((entry) => entry.width === 0)
    ? undefined
    : family.renditions.map((entry) => `${entry.src} ${entry.width}w`).join(", ")
}

function lastRendition(family: ImageCropFamily): ImageRendition {
  const result = family.renditions.at(-1)
  if (result == null) throw new Error("[ardo] A responsive image needs at least one rendition.")
  return result
}
