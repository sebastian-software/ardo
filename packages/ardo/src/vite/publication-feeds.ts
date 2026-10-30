import { toHtml } from "ferromark"
import type { ResolvedConfig } from "../config/types"
import type { Post, Publication } from "../publication/types"
import { getNativeMarkdownCompileOptions, prepareNativeMarkdown } from "../markdown/native-metadata"
import { rewritePortableReferences } from "./publication-links"

export type PortablePost = { post: Post; html: string }
type PortableInput = {
  source: string
  format: "md" | "mdx"
  feedContent?: unknown
  post: Post
  config: ResolvedConfig
}

/** Reject silent omissions, while keeping the complete static article explicit. */
export function createPortablePostBody(input: PortableInput): string {
  const markdown = portableMarkdown(input)
  const portable = rewritePortableReferences(markdown, input)
  return renderCover(input.post) + toHtml(portable, portableOptions(input.config))
}

function portableMarkdown(input: PortableInput): string {
  const { prepared } = prepareNativeMarkdown(input.source, input.format, input.config.markdown)
  const projection = prepared.projectMarkdown({
    frontMatter: "omit",
    omitTitleHeading: input.post.title,
  })
  const losses = projection.diagnostics.filter(
    (diagnostic) =>
      diagnostic.code !== "front-matter-omitted" && diagnostic.code !== "title-heading-omitted"
  )
  if (input.feedContent != null && typeof input.feedContent !== "string")
    throw new Error("feedContent must contain the full portable article as Markdown.")
  if (losses.length > 0 && input.feedContent == null)
    throw new Error(
      `Post ${input.post.id} needs feedContent with a complete static Markdown representation for Atom/RSS: ${[...new Set(losses.map((loss) => loss.code))].join(", ")}.`
    )
  const markdown = typeof input.feedContent === "string" ? input.feedContent : projection.markdown
  if (markdown.trim() === "") throw new Error(`Post ${input.post.id} has empty portable content.`)
  return markdown
}

function portableOptions(config: ResolvedConfig) {
  const {
    format: _format,
    calloutComponents: _calloutComponents,
    componentPrefix: _componentPrefix,
    codeBlockComponent: _codeBlockComponent,
    codeComponents: _codeComponents,
    output: _output,
    omitTitleHeading: _omitTitleHeading,
    ...htmlOptions
  } = getNativeMarkdownCompileOptions(config.markdown, { format: "md" })
  return { ...htmlOptions, frontMatter: false, renderPolicy: "untrusted" as const }
}

function renderCover(post: Post): string {
  const image = post.coverImage
  const source = image?.families[0]?.renditions.at(-1)?.src
  return image == null || source == null
    ? ""
    : `<figure><img src="${xml(new URL(source, post.url).href)}" alt="${xml(image.alt)}">${image.caption == null ? "" : `<figcaption>${xml(image.caption)}</figcaption>`}</figure>\n`
}

export function createPublicationFeeds(
  publication: Publication,
  posts: PortablePost[]
): Array<{ fileName: string; source: string }> {
  const prefix = publication.path.replaceAll(/^\/+|\/+$/gu, "")
  const updated = latestUpdate(posts)
  const atom = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<id>${xml(publication.url)}</id><title>${xml(publication.name)}</title>`,
    `<link rel="self" href="${xml(publication.atomUrl)}"/><link href="${xml(publication.url)}"/>`,
    `<updated>${updated}</updated>`,
    ...(publication.description == null
      ? []
      : [`<subtitle>${xml(publication.description)}</subtitle>`]),
    ...posts.map(
      ({ post, html }) =>
        `<entry><id>${xml(postId(post))}</id><title>${xml(post.title)}</title><link href="${xml(post.url)}"/><published>${post.publishedAt}</published><updated>${post.updatedAt ?? post.publishedAt}</updated>${atomAuthors(post)}${post.tags.map((tag) => `<category term="${xml(tag)}"/>`).join("")}<content type="html">${xml(html)}</content></entry>`
    ),
    "</feed>",
    "",
  ].join("\n")
  const rss = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${xml(publication.name)}</title><link>${xml(publication.url)}</link><description>${xml(publication.description ?? publication.name)}</description>`,
    `<atom:link href="${xml(publication.rssUrl)}" rel="self" type="application/rss+xml"/>`,
    ...posts.map(
      ({ post, html }) =>
        `<item><guid isPermaLink="false">${xml(postId(post))}</guid><title>${xml(post.title)}</title><link>${xml(post.url)}</link><pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>${post.authors.map((profile) => `<dc:creator>${xml(profile.name)}</dc:creator>`).join("")}${post.tags.map((tag) => `<category>${xml(tag)}</category>`).join("")}<description>${xml(post.description ?? post.title)}</description><content:encoded>${xml(html)}</content:encoded></item>`
    ),
    "</channel></rss>",
    "",
  ].join("\n")
  return [
    { fileName: `${prefix}/atom.xml`, source: atom },
    { fileName: `${prefix}/rss.xml`, source: rss },
  ]
}

function postId(post: Post): string {
  return `urn:ardo:post:${encodeURIComponent(post.id)}`
}
function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function latestUpdate(posts: PortablePost[]): string {
  let latest = "1970-01-01T00:00:00.000Z"
  for (const { post } of posts) {
    const date = post.updatedAt ?? post.publishedAt
    if (date > latest) latest = date
  }
  return latest
}
function atomAuthors(post: Post): string {
  return post.authors
    .map(
      (profile) =>
        `<author><name>${xml(profile.name)}</name>${profile.url == null ? "" : `<uri>${xml(profile.url)}</uri>`}</author>`
    )
    .join("")
}
