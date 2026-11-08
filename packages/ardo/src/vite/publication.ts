import type { Post, Publication } from "../publication/types"
import type { ImageAsset } from "./post-images"
import {
  createPublicationContext,
  publicationLanguage,
  type PublicationContext,
  type PublicationInput,
} from "./publication-context"
import { preparePublicationPost, type PreparedPost } from "./publication-post"
import { readPostFiles } from "./post-metadata"
import { resolvePublicationComponents, type PublicationComponents } from "./publication-options"
import {
  createPostRoute,
  createPublicationIndex,
  type PublicationRoute,
} from "./publication-routes"
import { createPublicationFeeds } from "./publication-feeds"
import { createPublicationTags, createTagRoute } from "./publication-tags"

export type PreparedPublication = {
  dependencies: Set<string>
  publication: Publication
  assets: Map<string, ImageAsset>
  feeds: Array<{ fileName: string; source: string }>
  routes: PublicationRoute[]
}

export async function preparePublication(input: PublicationInput): Promise<PreparedPublication> {
  const context = createPublicationContext(input)
  const components = await resolvePublicationComponents(context.options, context.config.root)
  const entries = []
  for (const sourceFile of await readPostFiles(context.sourceDir)) {
    const entry = await preparePublicationPost(sourceFile, context)
    if (entry != null) entries.push(entry)
  }
  entries.sort((a, b) => comparePosts(a.post, b.post))
  context.publication.posts = entries.map((entry) => entry.post)
  if (context.options.tags === true) context.publication.tags = createPublicationTags(context)
  return {
    publication: context.publication,
    assets: context.assets,
    dependencies: context.dependencies,
    feeds: createPublicationFeeds(context.publication, entries, {
      entryIds: context.options.feeds?.entryIds ?? "post",
      language: publicationLanguage(context),
    }),
    routes: createRoutes(context, entries, components),
  }
}

function createRoutes(
  context: PublicationContext,
  entries: PreparedPost[],
  modules: PublicationComponents
): PublicationRoute[] {
  return [
    ...entries.map((entry) => createPostRoute({ ...entry.route, modules })),
    createPublicationIndex(context, modules),
    ...(context.publication.tags ?? []).map((tag) => createTagRoute({ context, tag, modules })),
  ]
}

function comparePosts(a: Post, b: Post): number {
  return b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)
}
