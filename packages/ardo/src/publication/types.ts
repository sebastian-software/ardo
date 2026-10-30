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
  renditions: ImageRendition[]
}
export type PostImage = {
  alt: string
  caption?: string
  preset: ImagePreset
  families: ImageCropFamily[]
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
}
