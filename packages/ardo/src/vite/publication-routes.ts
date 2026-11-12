import path from "node:path"
import { stringify } from "yaml"
import type { PreparedJsxDocument } from "ferromark"
import type { Post, Publication } from "../publication/types"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import { publicationLanguage, type PublicationContext } from "./publication-context"
import { importPath, isAbsoluteHttpUrl, type PublicationComponents } from "./publication-options"
import { normalizePath } from "./path-utils"

export type PublicationRoute = {
  filePath: string
  sourceFile?: string
  content: string
  /** How a generated post route mounts the site's modules. */
  post?: PublicationPostBinding
  /**
   * The file's modification time: the latest update of the posts the page shows. Sitemap entries
   * and the route table read it, so a rewrite on every build must not stamp the build's clock.
   */
  lastmod?: string
}

/** The latest update among `posts`, or `fallback` (the pinned buildTime) for an empty list. */
export function latestPostDate(posts: readonly Post[], fallback?: string): string | undefined {
  let latest: string | undefined
  for (const post of posts) {
    const date = new Date(post.updatedAt ?? post.publishedAt).toISOString()
    if (latest == null || date > latest) latest = date
  }
  return latest ?? fallback
}

/**
 * What a generated post route imports. The post's Markdown compiles like any page; Ardo adds the
 * frame and metadata from these modules, so no other page bundles them.
 */
export type PublicationPostBinding = {
  /** Key of the post's publication in `virtual:ardo/publication`. */
  publication: string
  /** Absolute path of `publication.components.post`; Ardo's `ArdoPost` without it. */
  view?: string
  /** Absolute path of `publication.tagLabel`. */
  tagLabel?: string
  /** Path prefix of the tag archives, such as `/news/tags/`, when `tags` is enabled. */
  tagArchive?: string
  /** The publication's feed discovery links, part of every post's default metadata. */
  feeds: ArdoMetaDescriptor[]
  /** The post's source file, named by build errors. */
  sourceFile: string
  /** The post facts of its `BlogPosting` structured data, which the page metadata builds. */
  article: PublicationPostArticle
}

/**
 * Plain post data for the `BlogPosting` JSON-LD block. The page metadata adds the canonical URL,
 * resolves `image` against `siteUrl`, and names the site, so these values match the page's own.
 */
export type PublicationPostArticle = {
  headline: string
  /** The post's description, when it sets one. */
  description?: string
  datePublished: string
  /** The post's `updatedAt`, when it sets one. */
  dateModified?: string
  /** The feeds' language: the publication's locale, or the site language. */
  inLanguage: string
  /** The post's authors in post order; `url` only when it is an absolute http(s) URL. */
  authors: Array<{ name: string; url?: string }>
  /** The post's own share image or cover, unresolved, as the page's `og:image` uses it. */
  image?: string
}

export type PostRouteInput = {
  data: Record<string, unknown>
  source: string
  sourceFile: string
  prepared: PreparedJsxDocument
  post: Post
  routePath: string
  context: PublicationContext
  /** The authored `ogImage`, with a file beside the post already published as an asset. */
  ogImage?: string
}

export function createPostRoute(
  input: PostRouteInput & { modules?: PublicationComponents }
): PublicationRoute {
  const { data, source, prepared, post, context } = input
  const span = prepared.metadata.frontMatterSpan
  const bytes = Buffer.from(source)
  const body =
    span == null
      ? source
      : Buffer.concat([bytes.subarray(0, span.start), bytes.subarray(span.end)]).toString()
  const cover = post.coverImage
  // An authored share image wins; the cover's JPEG export is the fallback.
  const socialImage =
    input.ogImage ?? (cover?.fallback ?? cover?.families[0]?.renditions.at(-1))?.src
  // Ardo owns the internal field; an authored value must not leak into the generated route.
  const { feedContent: _feedContent, _ardoPost: _post, ...authored } = data
  const frontmatter = {
    ...authored,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    layout: "bare",
    sidebar: false,
    lede: false,
    editLink: false,
    lastUpdated: false,
    ...(socialImage == null ? {} : { ogImage: socialImage }),
    _ardoPost: post,
  }
  const article: PublicationPostArticle = {
    headline: post.title,
    ...(post.description == null ? {} : { description: post.description }),
    datePublished: post.publishedAt,
    ...(post.updatedAt == null ? {} : { dateModified: post.updatedAt }),
    inLanguage: publicationLanguage(context),
    authors: post.authors.map((author) => ({
      name: author.name,
      ...(isAbsoluteHttpUrl(author.url) ? { url: author.url } : {}),
    })),
    ...(socialImage == null ? {} : { image: socialImage }),
  }
  const modules = input.modules ?? {}
  return {
    filePath: path.join(
      context.routesDir,
      context.localeId ?? "",
      input.routePath.slice(1),
      `index.${input.sourceFile.endsWith(".mdx") ? "mdx" : "md"}`
    ),
    sourceFile: input.sourceFile,
    content: `---\n${stringify(frontmatter)}---\n${body.trimStart()}`,
    lastmod: latestPostDate([post]),
    post: {
      publication: publicationKey(context),
      feeds: feedDiscoveryMeta(context.publication),
      sourceFile: path.relative(context.config.root, input.sourceFile),
      article,
      ...(modules.post == null ? {} : { view: normalizePath(modules.post) }),
      ...(modules.tagLabel == null ? {} : { tagLabel: normalizePath(modules.tagLabel) }),
      ...(context.options.tags === true ? { tagArchive: tagArchivePrefix(context) } : {}),
    },
  }
}

export function createPublicationIndex(
  context: PublicationContext,
  modules: PublicationComponents = {}
): PublicationRoute {
  const { publication, config, options } = context
  const defaults = [
    { title: `${publication.name}${config.titleSeparator}${config.title}` },
    { name: "description", content: options.description ?? config.description },
    { tagName: "link", rel: "canonical", href: publication.url },
    ...feedDiscoveryMeta(publication),
  ]
  const filePath = path.join(context.routesDir, context.localizedPrefix, "index.tsx")
  const lines = [
    ...routePrelude({ context, filePath, modules, view: modules.index, type: "Index" }),
    "export const meta = () => {",
    `  const defaults: ArdoMetaDescriptor[] = ${JSON.stringify(defaults)}`,
    modules.index == null
      ? "  return defaults"
      : "  return site.meta == null ? defaults : site.meta({ publication, defaults })",
    "}",
    ...frontmatterExport(modules.index, "{ publication }"),
    "export default function News() {",
    `  return <ArdoPublicationTags${tagProps(context)}><View publication={publication} /></ArdoPublicationTags>`,
    "}",
  ]
  return {
    filePath,
    content: `${lines.join("\n")}\n`,
    lastmod: latestPostDate(publication.posts, config.buildTime),
  }
}

/**
 * The imports and bindings that every generated listing route shares. With a site module, `site`
 * is typed as its module contract, so a wrong export fails the site's type check.
 */
export function routePrelude(input: {
  context: PublicationContext
  filePath: string
  modules: PublicationComponents
  view: string | undefined
  type: "Index" | "Tag"
}): string[] {
  const { context, filePath, modules, view, type } = input
  const ui = ["ArdoPublicationTags", ...(view == null ? ["ArdoPostList"] : [])]
  const types = [
    ...(view == null ? [] : [`Publication${type}Module`]),
    ...(modules.tagLabel == null ? [] : ["PublicationTagLabel"]),
  ]
  return [
    'import type { ArdoMetaDescriptor } from "ardo/runtime"',
    `import { ${[...ui, ...types.map((name) => `type ${name}`)].join(", ")} } from "ardo/ui"`,
    'import { publications } from "virtual:ardo/publication"',
    ...(view == null
      ? []
      : [`import * as view from ${JSON.stringify(importPath(filePath, view))}`]),
    ...(modules.tagLabel == null
      ? []
      : [`import tagLabel from ${JSON.stringify(importPath(filePath, modules.tagLabel))}`]),
    `const publication = publications[${JSON.stringify(publicationKey(context))}]`,
    ...(view == null
      ? ["const View = ArdoPostList"]
      : [`const site: Publication${type}Module = view`, "const View = site.default"]),
    modules.tagLabel == null
      ? "const label = (key: string) => key"
      : "const label: PublicationTagLabel = tagLabel",
    'export const handle = { layout: "bare" }',
  ]
}

/**
 * The route's `frontmatter` export from the site module's optional one. Ardo calls it when it
 * renders the page, as it calls `meta`, so the value is computed from this route's own data on the
 * server and during hydration and is never serialized into a chunk. Without a site module, the
 * route has no such export.
 */
export function frontmatterExport(view: string | undefined, args: string): string[] {
  if (view == null) return []
  return [
    "const siteFrontmatter = site.frontmatter",
    `export const frontmatter = siteFrontmatter == null ? undefined : () => siteFrontmatter(${args})`,
  ]
}

/** Props of `ArdoPublicationTags`: the label function and, with archives, their path prefix. */
export function tagProps(context: PublicationContext): string {
  return context.options.tags === true
    ? ` label={label} archive={${JSON.stringify(tagArchivePrefix(context))}}`
    : " label={label}"
}

function tagArchivePrefix(context: PublicationContext): string {
  return `${context.publication.path}/tags/`
}

function publicationKey(context: PublicationContext): string {
  return context.localeId ?? "default"
}

/** Feed autodiscovery links of the generated listing pages. */
export function feedDiscoveryMeta(publication: Publication): ArdoMetaDescriptor[] {
  return [
    {
      tagName: "link",
      rel: "alternate",
      type: "application/atom+xml",
      href: publication.atomUrl,
      title: publication.name,
    },
    {
      tagName: "link",
      rel: "alternate",
      type: "application/rss+xml",
      href: publication.rssUrl,
      title: publication.name,
    },
  ]
}
