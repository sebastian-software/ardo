import path from "node:path"
import { stringify } from "yaml"
import type { PreparedJsxDocument } from "ferromark"
import type { Post, Publication } from "../publication/types"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import type { PublicationContext } from "./publication-context"
import { importPath } from "./publication-options"

export type PublicationRoute = { filePath: string; sourceFile?: string; content: string }

export type PostRouteInput = {
  data: Record<string, unknown>
  source: string
  sourceFile: string
  prepared: PreparedJsxDocument
  post: Post
  routePath: string
  context: PublicationContext
}

/** `meta` is the site's complete route metadata; without it, Ardo derives the page metadata. */
export function createPostRoute(
  input: PostRouteInput & { meta?: ArdoMetaDescriptor[] }
): PublicationRoute {
  const { data, source, prepared, post, context } = input
  const span = prepared.metadata.frontMatterSpan
  const bytes = Buffer.from(source)
  const body =
    span == null
      ? source
      : Buffer.concat([bytes.subarray(0, span.start), bytes.subarray(span.end)]).toString()
  const cover = post.coverImage
  const socialImage = (cover?.fallback ?? cover?.families[0]?.renditions.at(-1))?.src
  // Ardo owns the internal fields; authored values must not leak into the generated route.
  const { feedContent: _feedContent, _ardoPost: _post, _ardoMeta: _meta, ...authored } = data
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
    ...(input.meta == null ? {} : { _ardoMeta: input.meta }),
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

export function createPublicationIndex(
  context: PublicationContext,
  site: { component?: string; meta?: ArdoMetaDescriptor[] } = {}
): PublicationRoute {
  const { publication, config, options } = context
  const meta = site.meta ?? [
    { title: `${publication.name}${config.titleSeparator}${config.title}` },
    { name: "description", content: options.description ?? config.description },
    { tagName: "link", rel: "canonical", href: publication.url },
    ...feedDiscoveryMeta(publication),
  ]
  const filePath = path.join(context.routesDir, context.localizedPrefix, "index.tsx")
  const [component, element] =
    site.component == null
      ? ['import { ArdoPostList } from "ardo/ui"', "ArdoPostList"]
      : [
          `import PublicationIndex from ${JSON.stringify(importPath(filePath, site.component))}`,
          "PublicationIndex",
        ]
  return {
    filePath,
    content: `import { publications } from "virtual:ardo/publication"\n${component}\nconst publication = publications[${JSON.stringify(context.localeId ?? "default")}]\nexport const handle = { layout: "bare" }\nexport const meta = () => ${JSON.stringify(meta)}\nexport default function News() { return <${element} publication={publication} /> }\n`,
  }
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
