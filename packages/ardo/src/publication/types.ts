import type { ComponentType, ReactNode } from "react"
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
   * Generate one archive page per tag at `/<to>/tags/<key>`. Tag keys must be lowercase,
   * hyphenated slugs. Default: false.
   */
  tags?: boolean
  feeds?: PublicationFeedsConfig
  /**
   * Site modules that render the generated routes in place of Ardo's components. A module may
   * also export `meta`, which Ardo calls when it renders the route.
   */
  components?: PublicationComponentsConfig
  /**
   * Module whose default export is a {@link PublicationTagLabel}, relative to the project root.
   * Without it, tags show their key.
   */
  tagLabel?: string
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
 * Route modules, relative to the project root. Only the generated routes import them, so other
 * pages do not load their code. See {@link PublicationIndexModule},
 * {@link PublicationPostModule}, and {@link PublicationTagModule} for their exports.
 */
export type PublicationComponentsConfig = {
  index?: string
  post?: string
  tag?: string
}

/**
 * The display label of a tag key, called while Ardo renders a page, so it can use the site's
 * translation runtime. The key stays the tag's identity in URLs, the sitemap, and feeds.
 */
export type PublicationTagLabel = (key: string) => string

export type PublicationIndexProps = { publication: Publication }
export type PublicationPostProps = { post: Post; children: ReactNode }
export type PublicationTagProps = {
  publication: Publication
  tag: PublicationTag
  /** The tag's display label: the site's `tagLabel`, or the key. */
  label: string
  posts: readonly Post[]
}

/**
 * What a publication route module's `meta` export receives. `defaults` are the descriptors Ardo
 * would render without the export, a new list on every call; the returned list replaces them, so
 * spread `defaults` to extend them. The publication, post, and tag data is frozen and shared with
 * the page.
 */
export type PublicationIndexMetaArgs = {
  publication: Publication
  defaults: ArdoMetaDescriptor[]
}
export type PublicationPostMetaArgs = {
  publication: Publication
  post: Post
  defaults: ArdoMetaDescriptor[]
}
export type PublicationTagMetaArgs = {
  publication: Publication
  tag: PublicationTag
  /** The tag's display label: the site's `tagLabel`, or the key. */
  label: string
  posts: readonly Post[]
  defaults: ArdoMetaDescriptor[]
}

/** Exports of `publication.components.index`. */
export type PublicationIndexModule = {
  default: ComponentType<PublicationIndexProps>
  meta?: (args: PublicationIndexMetaArgs) => ArdoMetaDescriptor[]
}
/** Exports of `publication.components.post`, which frames each post's content. */
export type PublicationPostModule = {
  default: ComponentType<PublicationPostProps>
  meta?: (args: PublicationPostMetaArgs) => ArdoMetaDescriptor[]
}
/** Exports of `publication.components.tag`. */
export type PublicationTagModule = {
  default: ComponentType<PublicationTagProps>
  meta?: (args: PublicationTagMetaArgs) => ArdoMetaDescriptor[]
}

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

/**
 * A published post. Ardo freezes the data it hands to pages and site modules, which share it, so
 * the arrays are read-only: sort a copy, such as `[...publication.posts].sort(…)`.
 */
export type Post = {
  id: string
  title: string
  description?: string
  publishedAt: string
  updatedAt?: string
  tags: readonly string[]
  authors: readonly AuthorProfile[]
  path: string
  url: string
  publicationPath: string
  publicationName: string
  atomUrl: string
  rssUrl: string
  coverImage?: PostImage
  images: Readonly<Record<string, PostImage>>
  /**
   * Frontmatter fields Ardo does not know, such as a site's `nextStep`, as authored. Values are
   * YAML data; check their type before use. Set on the post's own page, in the post module's
   * props and `meta`; the posts of `virtual:ardo/publication` and of listing pages have `{}`, so
   * one page's fields do not ship with every other page.
   */
  data: Readonly<Record<string, unknown>>
}

export type Publication = {
  imagePresets: Record<string, ImagePreset>
  name: string
  description?: string
  path: string
  url: string
  atomUrl: string
  rssUrl: string
  posts: readonly Post[]
  /** Tag archives, ordered by key. Present only when `tags` is enabled. */
  tags?: readonly PublicationTag[]
}

export type PublicationTag = {
  /** The tag as authored in the posts' frontmatter and emitted as feed category. */
  key: string
  path: string
  url: string
}
