import type { Post, Publication } from "../publication/types"
import type { ImageAsset } from "./post-images"
import { createPublicationContext, type PublicationInput } from "./publication-context"
import { preparePublicationPost } from "./publication-post"
import { readPostFiles } from "./post-metadata"
import { createPublicationIndex, type PublicationRoute } from "./publication-routes"
import { createPublicationFeeds } from "./publication-feeds"

export type PreparedPublication = {
  dependencies: Set<string>
  publication: Publication
  assets: Map<string, ImageAsset>
  feeds: Array<{ fileName: string; source: string }>
  routes: PublicationRoute[]
}

export async function preparePublication(input: PublicationInput): Promise<PreparedPublication> {
  const context = createPublicationContext(input)
  const entries = []
  for (const sourceFile of await readPostFiles(context.sourceDir)) {
    const entry = await preparePublicationPost(sourceFile, context)
    if (entry != null) entries.push(entry)
  }
  entries.sort((a, b) => comparePosts(a.post, b.post))
  context.publication.posts = entries.map((entry) => entry.post)
  return {
    publication: context.publication,
    assets: context.assets,
    dependencies: context.dependencies,
    feeds: createPublicationFeeds(context.publication, entries),
    routes: [...entries.map((entry) => entry.route), createPublicationIndex(context)],
  }
}

function comparePosts(a: Post, b: Post): number {
  return b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)
}
