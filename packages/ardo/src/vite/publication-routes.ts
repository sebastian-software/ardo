import path from "node:path"
import { stringify } from "yaml"
import type { PreparedJsxDocument } from "ferromark"
import type { Post } from "../publication/types"
import type { PublicationContext } from "./publication-context"

export type PublicationRoute = { filePath: string; sourceFile?: string; content: string }

export function createPostRoute(input: {
  data: Record<string, unknown>
  source: string
  sourceFile: string
  prepared: PreparedJsxDocument
  post: Post
  routePath: string
  context: PublicationContext
}): PublicationRoute {
  const { data, source, prepared, post, context } = input
  const span = prepared.metadata.frontMatterSpan
  const bytes = Buffer.from(source)
  const body =
    span == null
      ? source
      : Buffer.concat([bytes.subarray(0, span.start), bytes.subarray(span.end)]).toString()
  const socialImage = post.coverImage?.families[0]?.renditions.at(-1)?.src
  const { feedContent: _feedContent, ...authored } = data
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
  return {
    filePath: path.join(
      context.routesDir,
      context.localeId ?? "",
      input.routePath.slice(1),
      `index.${input.sourceFile.endsWith(".mdx") ? "mdx" : "md"}`
    ),
    sourceFile: input.sourceFile,
    content: `---\n${stringify(frontmatter)}---\n${body.trimStart()}`,
  }
}

export function createPublicationIndex(context: PublicationContext): PublicationRoute {
  const { publication, config, options } = context
  const meta = [
    { title: `${publication.name}${config.titleSeparator}${config.title}` },
    { name: "description", content: options.description ?? config.description },
    { tagName: "link", rel: "canonical", href: publication.url },
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
  return {
    filePath: path.join(context.routesDir, context.localizedPrefix, "index.tsx"),
    content: `import { publications } from "virtual:ardo/publication"\nimport { ArdoPostList } from "ardo/ui"\nconst publication = publications[${JSON.stringify(context.localeId ?? "default")}]\nexport const handle = { layout: "bare" }\nexport const meta = () => ${JSON.stringify(meta)}\nexport default function News() { return <ArdoPostList publication={publication} /> }\n`,
  }
}
