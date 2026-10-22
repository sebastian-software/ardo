import { prepareDocument } from "ferromark"

/** Preserve authored Markdown and code while projecting static MDX content. */
export function stripMdxSyntaxOutsideCodeFences(content: string, title?: string): string {
  return prepareDocument(content, { format: "mdx" }).projectMarkdown({
    omitTitleHeading: title,
  }).markdown
}
