import type { MarkdownConfig } from "../config/types"
import { prepareNativeMarkdown } from "../markdown/native-metadata"

/** Preserve authored Markdown and code while projecting static MDX content. */
export function stripMdxSyntaxOutsideCodeFences(
  content: string,
  title?: string,
  options: { format?: "md" | "mdx"; markdown?: MarkdownConfig } = {}
): string {
  return prepareNativeMarkdown(
    content,
    options.format ?? "mdx",
    options.markdown ?? {}
  ).prepared.projectMarkdown({
    omitTitleHeading: title,
  }).markdown
}
