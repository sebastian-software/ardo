import type { ThemeInput } from "@ferriki/core"
import type { CompileJsxOptions } from "ferromark"

// =============================================================================
// Markdown Config
// =============================================================================

type NativeMarkdownConfig = Pick<
  CompileJsxOptions,
  | "allowLinkRefs"
  | "autolinkLiterals"
  | "blockquoteAttributions"
  | "bracketedSpans"
  | "callouts"
  | "cjkEmphasis"
  | "definitionLists"
  | "extendedAttributes"
  | "footnotes"
  | "guillemetDigraphs"
  | "headingAttributes"
  | "headingIdPrefix"
  | "headingOffset"
  | "highlight"
  | "imageAttributes"
  | "imageCaptions"
  | "inlineFootnotes"
  | "insertions"
  | "lineComments"
  | "math"
  | "mergedTableCells"
  | "passes"
  | "strikethrough"
  | "subscript"
  | "superscript"
  | "tableAttributes"
  | "tables"
  | "taskLists"
  | "typography"
>

export type MarkdownConfig = {
  /** Ferriki syntax-highlighting theme name or light/dark theme pair. */
  theme?: { light: ThemeInput; dark: ThemeInput } | ThemeInput
  /** Show line numbers in code blocks */
  lineNumbers?: boolean
  /** Enable anchor links for headings */
  anchor?: boolean
  /** Table of contents configuration */
  toc?: {
    level?: [number, number]
  }
} & NativeMarkdownConfig
