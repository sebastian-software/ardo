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

/** Keep media groups in order, with format preferences inside each composition. */
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
  const rendition = lastRendition(fallback.renditions)
  return (
    <picture>
      {presentation.sources?.map((source) => (
        <PictureSources
          key={`${source.media}-${source.composition}`}
          family={family(source.composition)}
          media={source.media}
          sizes={source.sizes ?? presentation.sizes}
        />
      ))}
      <PictureSources family={fallback} sizes={props.sizes ?? presentation.sizes} />
      <img
        {...props}
        src={rendition.src}
        srcSet={srcset(fallback.renditions) ?? props.srcSet}
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

function PictureSources({
  family,
  media,
  sizes,
}: {
  family: ImageCropFamily
  media?: string
  sizes: string
}) {
  const formats = (family.formats ?? []).map((format) => ({
    type: `image/${format.format}`,
    renditions: format.renditions,
  }))
  const sources =
    media == null ? formats : [...formats, { type: undefined, renditions: family.renditions }]
  return sources.map((source) => {
    const candidate = lastRendition(source.renditions)
    return (
      <source
        key={source.type ?? "fallback"}
        type={source.type}
        media={media}
        srcSet={srcset(source.renditions)}
        sizes={sizes}
        width={candidate.width || undefined}
        height={candidate.height || undefined}
      />
    )
  })
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
