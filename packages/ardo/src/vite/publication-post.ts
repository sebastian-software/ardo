import fs from "node:fs/promises"
import type { Post } from "../publication/types"
import { prepareNativeMarkdown } from "../markdown/native-metadata"
import type { PublicationContext } from "./publication-context"
import { parsePostMetadata, type PostMetadata } from "./post-metadata"
import { preparePostAuthors, preparePostImages } from "./publication-images"
import { createPortablePostBody } from "./publication-feeds"
import { createPostRoute } from "./publication-routes"

export async function preparePublicationPost(sourceFile: string, context: PublicationContext) {
  try {
    const source = await fs.readFile(sourceFile, "utf8")
    const format = sourceFile.endsWith(".mdx") ? "mdx" : "md"
    const { frontmatter: data, prepared } = prepareNativeMarkdown(source, format, {
      ...context.config.markdown,
      trackReferences: true,
    })
    const metadata = parsePostMetadata(data, sourceFile, context)
    if (metadata.draft || new Date(metadata.publishedAt) > (context.now ?? new Date())) return
    const authors = await preparePostAuthors(metadata.authorKeys, context)
    const images = await preparePostImages({ data, prepared, sourceFile, context })
    const post = createPost(metadata, { authors, ...images }, context)
    return {
      post,
      html: createPortablePostBody({
        source,
        format,
        feedContent: data.feedContent,
        post,
        config: context.config,
      }),
      route: createPostRoute({
        data,
        source,
        sourceFile,
        prepared,
        post,
        routePath: metadata.routePath,
        context,
      }),
    }
  } catch (error) {
    throw new Error(
      `[ardo] Invalid post ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
}

function createPost(
  metadata: PostMetadata,
  rendering: Pick<Post, "authors" | "images" | "coverImage">,
  context: PublicationContext
): Post {
  const route =
    context.localeId == null ? metadata.routePath : `/${context.localeId}${metadata.routePath}`
  return {
    id: metadata.id,
    title: metadata.title,
    description: metadata.description,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    tags: metadata.tags,
    ...rendering,
    path: route,
    url: new URL(`${context.config.deploymentBase}${route.slice(1)}/`, context.config.siteUrl).href,
    publicationPath: context.publication.path,
    publicationName: context.publication.name,
    atomUrl: context.publication.atomUrl,
    rssUrl: context.publication.rssUrl,
  }
}
