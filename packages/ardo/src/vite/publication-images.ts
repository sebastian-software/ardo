import path from "node:path"
import type { PreparedJsxDocument } from "ferromark"
import type { AuthorProfile, PostImage } from "../publication/types"
import { collectImageInputs } from "./image-references"
import type { PublicationContext } from "./publication-context"
import { readCoverImage } from "./post-metadata"
import { preparePostImage, prepareShareImage } from "./post-images"

export async function preparePostAuthors(
  keys: string[],
  context: PublicationContext
): Promise<AuthorProfile[]> {
  const authors = []
  for (const key of keys) {
    const profile = Object.hasOwn(context.options.authors ?? {}, key)
      ? context.options.authors[key]
      : undefined
    if (profile == null || typeof profile.name !== "string" || profile.name.trim() === "")
      throw new Error(`Unknown or invalid author profile ${JSON.stringify(key)}.`)
    if (profile.did != null && !/^did:[a-z]+:[^\s]+$/u.test(profile.did))
      throw new Error(`Invalid AT DID for author ${key}.`)
    const author = { ...profile, id: key }
    if (author.avatar != null && !/^(?:https?:)?\/\//iu.test(author.avatar))
      author.avatar = await prepareAvatar(author, context)
    authors.push(author)
  }
  return authors
}

async function prepareAvatar(
  author: AuthorProfile,
  context: PublicationContext
): Promise<string | undefined> {
  const image = await preparePostImage({
    image: { src: author.avatar ?? "", alt: author.name },
    sourceFile: path.join(context.config.root, "_author"),
    root: context.config.root,
    base: context.config.deploymentBase,
    config: { widths: [96, 192], provider: context.options.images?.provider },
    jpegFallback: false,
    assets: context.assets,
    dependencies: context.dependencies,
  })
  return image.families[0].renditions.at(-1)?.src
}

type ImageInput = {
  data: Record<string, unknown>
  prepared: PreparedJsxDocument
  sourceFile: string
  context: PublicationContext
}

export async function preparePostImages(
  input: ImageInput
): Promise<{ images: Record<string, PostImage>; coverImage?: PostImage }> {
  const { data, context, sourceFile } = input
  const images: Record<string, PostImage> = Object.create(null)
  const options = {
    sourceFile,
    root: context.config.root,
    base: context.config.deploymentBase,
    config: context.options.images,
    assets: context.assets,
    dependencies: context.dependencies,
  }
  for (const [src, image] of collectImageInputs({ ...input, markdown: context.config.markdown }))
    images[src] = await preparePostImage({ ...options, image })
  const coverImage =
    data.coverImage == null
      ? undefined
      : await preparePostImage({ ...options, image: readCoverImage(data.coverImage) })
  return { images, coverImage }
}

/**
 * An authored `ogImage` beside the post (`./social.png`) is published as a build asset.
 * URLs and root-relative `public/` paths stay as written.
 */
export async function preparePostOgImage(
  input: Omit<ImageInput, "prepared">
): Promise<string | undefined> {
  const { data, context, sourceFile } = input
  const value = data.ogImage
  if (value == null) return
  if (typeof value !== "string" || value.trim() === "")
    throw new TypeError("ogImage must be a non-empty string.")
  if (!/^\.\.?\//u.test(value)) return value
  return prepareShareImage({
    src: value,
    sourceFile,
    root: context.config.root,
    base: context.config.deploymentBase,
    assets: context.assets,
    dependencies: context.dependencies,
  })
}
