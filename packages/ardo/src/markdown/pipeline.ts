import matter from "gray-matter"
import rehypeStringify from "rehype-stringify"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"

import type { MarkdownConfig, PageFrontmatter, TOCItem } from "../config/types"

import { rehypeLinks } from "./links"
import { createShikiHighlighter, rehypeShikiFromHighlighter, type ShikiHighlighter } from "./shiki"
import { remarkExtractToc, type TocExtraction } from "./toc"

export interface TransformResult {
  html: string
  frontmatter: PageFrontmatter
  toc: TOCItem[]
}

export interface TransformOptions {
  basePath?: string
  highlighter?: ShikiHighlighter
}

export async function transformMarkdown(
  content: string,
  config: MarkdownConfig,
  options: TransformOptions = {}
): Promise<TransformResult> {
  const { data, content: markdownContent } = matter(content)
  const frontmatterData: unknown = data
  const { basePath = "/", highlighter: providedHighlighter } = options

  const tocExtraction: TocExtraction = { toc: [] }
  const highlighter = providedHighlighter ?? (await createShikiHighlighter(config))

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkExtractToc, { tocExtraction, levels: config.toc?.level ?? [2, 3] })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShikiFromHighlighter, { highlighter, config })
    .use(rehypeLinks, { basePath })
    .use(rehypeStringify, { allowDangerousHtml: true })

  if (config.remarkPlugins) {
    for (const plugin of config.remarkPlugins) {
      processor.use(plugin as Parameters<typeof processor.use>[0])
    }
  }

  if (config.rehypePlugins) {
    for (const plugin of config.rehypePlugins) {
      processor.use(plugin as Parameters<typeof processor.use>[0])
    }
  }

  const result = await processor.process(markdownContent)

  return {
    html: String(result),
    frontmatter: frontmatterData as PageFrontmatter,
    toc: tocExtraction.toc,
  }
}

export async function transformMarkdownToReact(
  content: string,
  config: MarkdownConfig
): Promise<TransformResult> {
  return transformMarkdown(content, config)
}
