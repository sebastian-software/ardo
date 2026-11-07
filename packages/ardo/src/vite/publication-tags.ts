import path from "node:path"
import type { PublicationTag } from "../publication/types"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import { canonicalUrl, publicationUrl, type PublicationContext } from "./publication-context"
import { importPath } from "./publication-options"
import { feedDiscoveryMeta, type PublicationRoute } from "./publication-routes"

const TAG_KEY = /^[\da-z]+(?:-[\da-z]+)*$/u

/** Tag keys become URL segments, so they must already be slugs, unique within each post. */
export function validatePostTags(post: { tags: string[]; routePath: string }, prefix: string) {
  const seen = new Set<string>()
  for (const tag of post.tags) {
    if (!TAG_KEY.test(tag))
      throw new Error(
        `Tag ${JSON.stringify(tag)} must be a lowercase, hyphenated slug such as "release-notes"; tag archives use it as URL segment. Map keys to display labels in the site's components.`
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
  publications: Array<{ locale?: string; entry: { publication: { tags?: PublicationTag[] } } }>
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
  component?: string
  meta?: ArdoMetaDescriptor[]
}): PublicationRoute {
  const { context, tag, component } = input
  const filePath = path.join(
    context.routesDir,
    context.localizedPrefix,
    "tags",
    tag.key,
    "index.tsx"
  )
  // The tag is a literal, so the route type-checks without narrowing `publication.tags`.
  const lines = [
    'import { publications } from "virtual:ardo/publication"',
    component == null
      ? 'import { ArdoPostList } from "ardo/ui"'
      : `import PublicationTag from ${JSON.stringify(importPath(filePath, component))}`,
    `const publication = publications[${JSON.stringify(context.localeId ?? "default")}]`,
    `const tag = ${JSON.stringify(tag)}`,
    ...(component == null
      ? []
      : [
          `const posts = publication.posts.filter((post) => post.tags.includes(${JSON.stringify(tag.key)}))`,
        ]),
    'export const handle = { layout: "bare" }',
    `export const meta = () => ${JSON.stringify(input.meta ?? defaultTagMeta(context, tag))}`,
    component == null
      ? "export default function Tag() { return <ArdoPostList publication={publication} tag={tag} /> }"
      : "export default function Tag() { return <PublicationTag publication={publication} tag={tag} posts={posts} /> }",
  ]
  return { filePath, content: `${lines.join("\n")}\n` }
}

function defaultTagMeta(context: PublicationContext, tag: PublicationTag): ArdoMetaDescriptor[] {
  const { publication, config, options } = context
  const separator = config.titleSeparator
  return [
    { title: `${tag.key}${separator}${publication.name}${separator}${config.title}` },
    { name: "description", content: options.description ?? config.description },
    // Like a post's default canonical, it matches the sitemap entry, which has no final slash.
    { tagName: "link", rel: "canonical", href: canonicalUrl(tag.path, context) },
    ...feedDiscoveryMeta(publication),
  ]
}
