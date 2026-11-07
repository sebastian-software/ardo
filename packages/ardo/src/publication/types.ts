import type { ReactNode } from "react"
import type { ArdoMetaDescriptor } from "../runtime/page-context"

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
  /** AVIF resolutions, or the unchanged SVG/animated/remote source. */
  renditions: ImageRendition[]
}
export type PostImage = {
  alt: string
  caption?: string
  preset: ImagePreset
  families: ImageCropFamily[]
  /** One JPEG in the default composition, at most 1280px wide, for fallback and exports. */
  fallback?: ImageRendition
}

export type AuthorProfile = {
  /** Registry key, supplied in resolved publication data. */
  id?: string
  name: string
  avatar?: string
  description?: string
  title?: string
  url?: string
  links?: Array<{ name: string; url: string }>
  did?: string
}

export type PublicationConfig = {
  /** Local directory of Markdown/MDX posts, relative to the project root. */
  from: string
  /** Generated route directory. Default: "news". */
  to?: string
  name?: string
  description?: string
  authors: Record<string, AuthorProfile>
  images?: { widths?: number[]; presets?: Record<string, ImagePreset> }
  /**
   * End publication, post, and tag archive URLs, and the feed links built from them, with a
   * slash. Default: true.
   */
  trailingSlash?: boolean
  /**
   * Generate one archive page per tag at `/<to>/tags/<key>`. Tag keys must be lowercase,
   * hyphenated slugs. Default: false.
   */
  tags?: boolean
  feeds?: PublicationFeedsConfig
  /** Site modules that render the generated routes in place of Ardo's components. */
  components?: PublicationComponentsConfig
  /** Build-time functions whose result replaces Ardo's metadata of the generated routes. */
  meta?: PublicationMetaConfig
}

export type PublicationFeedsConfig = {
  /**
   * Atom entry IDs and RSS GUIDs. `"post"` (default) uses the post ID alone. `"publication"`
   * qualifies it with the publication's host and path, so publications that share post IDs, such
   * as translations on separate sites, publish distinct entries. Changing it re-announces every
   * entry to existing subscribers.
   */
  entryIds?: "post" | "publication"
}

/**
 * Module paths, relative to the project root. Each module default-exports a React component:
 * `index` receives {@link PublicationIndexProps}, `post` {@link PublicationPostProps}, and `tag`
 * {@link PublicationTagProps}.
 */
export type PublicationComponentsConfig = {
  index?: string
  post?: string
  tag?: string
}

/** The returned descriptors are the route's complete metadata and must be JSON-serializable. */
export type PublicationMetaConfig = {
  index?: (input: { publication: Publication }) => ArdoMetaDescriptor[]
  post?: (input: { publication: Publication; post: Post }) => ArdoMetaDescriptor[]
  tag?: (input: {
    publication: Publication
    tag: PublicationTag
    posts: Post[]
  }) => ArdoMetaDescriptor[]
}

export type PublicationIndexProps = { publication: Publication }
export type PublicationPostProps = { post: Post; children: ReactNode }
export type PublicationTagProps = { publication: Publication; tag: PublicationTag; posts: Post[] }

/** Metadata authored in a post's YAML frontmatter. IDs are assigned once. */
export type PostFrontmatter = {
  id: string
  title: string
  description?: string
  publishedAt: string
  updatedAt?: string
  authors: string[]
  tags?: string[]
  path?: string
  draft?: boolean
  coverImage?: PostImageInput
  images?: Record<string, Omit<PostImageInput, "alt" | "src"> & { alt?: string }>
  /** Complete static Markdown article for portable outputs when MDX needs a replacement. */
  feedContent?: string
}

export type Post = {
  id: string
  title: string
  description?: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  authors: AuthorProfile[]
  path: string
  url: string
  publicationPath: string
  publicationName: string
  atomUrl: string
  rssUrl: string
  coverImage?: PostImage
  images: Record<string, PostImage>
}

export type Publication = {
  imagePresets: Record<string, ImagePreset>
  name: string
  description?: string
  path: string
  url: string
  atomUrl: string
  rssUrl: string
  posts: Post[]
  /** Tag archives, ordered by key. Present only when `tags` is enabled. */
  tags?: PublicationTag[]
}

export type PublicationTag = {
  /** The tag as authored in the posts' frontmatter and emitted as feed category. */
  key: string
  path: string
  url: string
}
