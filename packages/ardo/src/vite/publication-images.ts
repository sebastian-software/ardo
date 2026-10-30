import path from "node:path"
import type { PreparedJsxDocument } from "ferromark"
import type { AuthorProfile, PostImage, PostImageInput } from "../publication/types"
import { prepareNativeMarkdown } from "../markdown/native-metadata"
import type { PublicationContext } from "./publication-context"
import { record, readCoverImage } from "./post-metadata"
import { preparePostImage } from "./post-images"

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
    config: { widths: [96, 192] },
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
  for (const [src, image] of collectImages(input))
    images[src] = await preparePostImage({ ...options, image })
  const coverImage =
    data.coverImage == null
      ? undefined
      : await preparePostImage({ ...options, image: readCoverImage(data.coverImage) })
  return { images, coverImage }
}

function collectImages({ data, prepared, context }: ImageInput): Map<string, PostImageInput> {
  const metadata = record(data.images, "images")
  const portable = typeof data.feedContent === "string" ? data.feedContent : ""
  const references = [
    ...prepared.collectReferences(),
    ...prepareNativeMarkdown(portable, "md", {
      ...context.config.markdown,
      trackReferences: true,
    }).prepared.collectReferences(),
  ]
  const images = new Map<string, PostImageInput>()
  for (const reference of references) {
    if (
      reference.kind !== "image" &&
      !(
        reference.kind === "mdxAttribute" &&
        reference.attribute === "src" &&
        reference.element === "Image"
      )
    )
      continue
    images.set(reference.destination, {
      src: reference.destination,
      alt: reference.text ?? "",
      ...record(metadata[reference.destination], `images.${reference.destination}`),
    } as PostImageInput)
  }
  for (const [src, descriptor] of Object.entries(metadata))
    images.set(src, { src, alt: "", ...record(descriptor, `images.${src}`) } as PostImageInput)
  return images
}
