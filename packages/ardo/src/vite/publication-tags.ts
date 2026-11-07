import path from "node:path"
import type { PublicationTag } from "../publication/types"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import { canonicalUrl, publicationUrl, type PublicationContext } from "./publication-context"
import type { PublicationComponents } from "./publication-options"
import {
  feedDiscoveryMeta,
  latestPostDate,
  routePrelude,
  tagProps,
  type PublicationRoute,
} from "./publication-routes"

const TAG_KEY = /^[\da-z]+(?:-[\da-z]+)*$/u

/** Tag keys become URL segments, so they must already be slugs, unique within each post. */
export function validatePostTags(post: { tags: string[]; routePath: string }, prefix: string) {
  const seen = new Set<string>()
  for (const tag of post.tags) {
    if (!TAG_KEY.test(tag))
      throw new Error(
        `Tag ${JSON.stringify(tag)} must be a lowercase, hyphenated slug such as "release-notes"; tag archives use it as URL segment. Show display labels with publication.tagLabel.`
      )
    if (seen.has(tag)) throw new Error(`Post lists tag ${JSON.stringify(tag)} more than once.`)
    seen.add(tag)
  }
  const archives = `/${prefix}/tags`
  if (post.routePath === archives || post.routePath.startsWith(`${archives}/`))
    throw new Error(
      `Post path ${post.routePath} collides with the tag archives under ${archives}. Choose another path.`
    )
}

/**
 * Localized routes must exist in every locale. A tag archive missing from one locale would only
 * surface as a missing translation of a page, so name the tag and the locales instead.
 */
export function validateTagLocales(
  publications: Array<{
    locale?: string
    entry: { publication: { tags?: readonly PublicationTag[] } }
  }>
): void {
  const keys = publications.map(
    ({ entry }) => new Set(entry.publication.tags?.map((tag) => tag.key))
  )
  publications.forEach(({ locale }, index) => {
    for (const key of keys[index]) {
      const missing = publications.find((_, other) => !keys[other].has(key))
      if (missing != null)
        throw new Error(
          `[ardo] Tag ${JSON.stringify(key)} exists in ${locale} but not ${missing.locale}; tag archives need the same keys in every locale.`
        )
    }
  })
}

/** One archive per tag of a published post, ordered by key. */
export function createPublicationTags(context: PublicationContext): PublicationTag[] {
  const keys = [...new Set(context.publication.posts.flatMap((post) => post.tags))].sort()
  return keys.map((key) => {
    const routePath = `/${context.localizedPrefix}/tags/${key}`
    return { key, path: routePath, url: publicationUrl(routePath, context) }
  })
}

export function createTagRoute(input: {
  context: PublicationContext
  tag: PublicationTag
  modules?: PublicationComponents
}): PublicationRoute {
  const { context, tag } = input
  const modules = input.modules ?? {}
  const { publication, config, options } = context
  const filePath = path.join(
    context.routesDir,
    context.localizedPrefix,
    "tags",
    tag.key,
    "index.tsx"
  )
  const separator = JSON.stringify(
    `${config.titleSeparator}${publication.name}${config.titleSeparator}${config.title}`
  )
  const rest: ArdoMetaDescriptor[] = [
    { name: "description", content: options.description ?? config.description },
    // Like a post's default canonical, it matches the tag's sitemap entry.
    { tagName: "link", rel: "canonical", href: canonicalUrl(tag.path, context) },
    ...feedDiscoveryMeta(publication),
  ]
  // The tag is a literal, so the route type-checks without narrowing `publication.tags`. The
  // label is resolved while the page renders, so it can come from the site's translations.
  const lines = [
    ...routePrelude({ context, filePath, modules, view: modules.tag, type: "Tag" }),
    `const tag = Object.freeze(${JSON.stringify(tag)})`,
    ...(modules.tag == null
      ? []
      : [
          `const posts = Object.freeze(publication.posts.filter((post) => post.tags.includes(${JSON.stringify(tag.key)})))`,
        ]),
    "export const meta = () => {",
    "  const tagLabel = label(tag.key)",
    `  const defaults: ArdoMetaDescriptor[] = [{ title: tagLabel + ${separator} }, ${JSON.stringify(rest).slice(1, -1)}]`,
    modules.tag == null
      ? "  return defaults"
      : "  return site.meta == null ? defaults : site.meta({ publication, tag, label: tagLabel, posts, defaults })",
    "}",
    "export default function Tag() {",
    modules.tag == null
      ? `  return <ArdoPublicationTags${tagProps(context)}><View publication={publication} tag={tag} /></ArdoPublicationTags>`
      : `  return <ArdoPublicationTags${tagProps(context)}><View publication={publication} tag={tag} label={label(tag.key)} posts={posts} /></ArdoPublicationTags>`,
    "}",
  ]
  return {
    filePath,
    content: `${lines.join("\n")}\n`,
    lastmod: latestPostDate(
      publication.posts.filter((post) => post.tags.includes(tag.key)),
      config.buildTime
    ),
  }
}
