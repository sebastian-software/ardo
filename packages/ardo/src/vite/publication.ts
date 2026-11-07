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
import { resolvePublicationComponents } from "./publication-options"
import { frozenCopy, runSiteMeta } from "./publication-site-meta"
import {
  createPostRoute,
  createPublicationIndex,
  type PublicationRoute,
} from "./publication-routes"
import { createPublicationFeeds } from "./publication-feeds"
import { taggedPosts } from "../publication/tags"
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

/**
 * Site metadata functions run once the publication is complete, so they can list every post.
 * They receive one frozen copy of the data; the pages keep the original.
 */
function createRoutes(
  context: PublicationContext,
  entries: PreparedPost[],
  components: Awaited<ReturnType<typeof resolvePublicationComponents>>
): PublicationRoute[] {
  const { index, post, tag } = context.options.meta ?? {}
  const data =
    index == null && post == null && tag == null ? undefined : frozenCopy(context.publication)
  return [
    ...entries.map((entry, position) =>
      createPostRoute({
        ...entry.route,
        meta:
          post &&
          data &&
          runSiteMeta("post", `post ${JSON.stringify(entry.post.id)}`, () =>
            post({ publication: data, post: data.posts[position] })
          ),
      })
    ),
    createPublicationIndex(context, {
      component: components.index,
      meta:
        index &&
        data &&
        runSiteMeta("index", context.publication.path, () => index({ publication: data })),
    }),
    ...(context.publication.tags ?? []).map((entry, position) =>
      createTagRoute({
        context,
        tag: entry,
        component: components.tag,
        meta:
          tag &&
          data &&
          runSiteMeta("tag", `tag ${JSON.stringify(entry.key)}`, () => {
            const archive = data.tags?.[position] ?? entry
            return tag({ publication: data, tag: archive, posts: taggedPosts(data.posts, archive) })
          }),
      })
    ),
  ]
}

function comparePosts(a: Post, b: Post): number {
  return b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)
}
