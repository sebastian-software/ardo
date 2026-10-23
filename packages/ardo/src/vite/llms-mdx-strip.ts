import { prepareDocument } from "ferromark"

/** Preserve authored Markdown and code while projecting static MDX content. */
export function stripMdxSyntaxOutsideCodeFences(
  content: string,
  title?: string,
  format: "md" | "mdx" = "mdx"
): string {
  return prepareDocument(content, { format }).projectMarkdown({
    omitTitleHeading: title,
  }).markdown
}
