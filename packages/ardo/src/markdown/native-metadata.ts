import type { CompileJsxOptions, JsxModuleResult, JsxRenderOptions, JsxResult } from "ferromark"

import { parse as parseYaml } from "yaml"

import type { MarkdownConfig } from "../config/types"

import { getJsxCompiler } from "./jsx-compiler"

export type NativeMarkdownFormat = "md" | "mdx"

export type NativeMarkdownHeading = {
  end: number
  id?: string
  level: number
  start: number
  text: string
}

export type NativeMarkdownMetadata = {
  content: string
  frontmatter: Record<string, unknown>
  headings: NativeMarkdownHeading[]
}

const nativeOptionKeys = [
  "tableAttributes",
  "headingAttributes",
  "cjkEmphasis",
  "imageAttributes",
  "imageCaptions",
  "extendedAttributes",
  "bracketedSpans",
  "blockquoteAttributions",
  "insertions",
  "guillemetDigraphs",
  "tables",
  "mergedTableCells",
  "strikethrough",
  "superscript",
  "subscript",
  "taskLists",
  "autolinkLiterals",
  "footnotes",
  "highlight",
  "inlineFootnotes",
  "allowLinkRefs",
  "math",
  "callouts",
  "definitionLists",
  "lineComments",
  "typography",
  "passes",
  "headingOffset",
  "headingIdPrefix",
] as const satisfies ReadonlyArray<keyof MarkdownConfig>

const defaultCalloutComponents = {
  caution: "Danger",
  important: "Info",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
}

/**
 * Build compile options shared by the route compiler and metadata consumers.
 * Engine syntax and ordered native passes are forwarded from the public config;
 * module grammar and heading identity stay under Ardo's control.
 */
export function getNativeMarkdownCompileOptions(
  markdownConfig: MarkdownConfig = {},
  options: {
    codeBlockComponent?: string
    componentPrefix?: string
    format: NativeMarkdownFormat
    headingIds?: boolean
  }
): CompileJsxOptions {
  const forwarded: Partial<CompileJsxOptions> = {}
  for (const key of nativeOptionKeys) {
    const value = markdownConfig[key]
    if (value !== undefined) {
      Object.assign(forwarded, { [key]: value })
    }
  }

  return {
    footnotes: true,
    autolinkLiterals: true,
    ...forwarded,
    format: options.format,
    frontMatter: true,
    headingIds: options.headingIds ?? markdownConfig.anchor ?? true,
    calloutComponents: defaultCalloutComponents,
    codeComponents: { mermaid: "_ArdoMermaid" },
    ...(options.codeBlockComponent == null
      ? {}
      : { codeBlockComponent: options.codeBlockComponent }),
    ...(options.componentPrefix == null ? {} : { componentPrefix: options.componentPrefix }),
  }
}

/**
 * Read route metadata with the same native parser and heading planner used by
 * generated route modules. Heading ranges returned here index `content` as
 * UTF-8 byte offsets, which lets search excerpt boundaries remain exact.
 */
export function readNativeMarkdownMetadata(
  source: string,
  format: NativeMarkdownFormat,
  markdownConfig: MarkdownConfig = {}
): NativeMarkdownMetadata {
  const { prepared, frontmatter, renderOptions } = prepareNativeMarkdown(
    source,
    format,
    markdownConfig
  )
  // Metadata consumers need final heading planning, but never highlighted JSX.
  const result = prepared.render(renderOptions, () => "<pre />")
  return createNativeMarkdownMetadata(source, frontmatter, result)
}

/** Prepare per invocation so HMR always uses the current source and options. */
export function prepareNativeMarkdown(
  source: string,
  format: NativeMarkdownFormat,
  markdownConfig: MarkdownConfig = {}
) {
  const {
    calloutComponents,
    codeComponents,
    codeBlockComponent,
    componentPrefix,
    headingIds,
    headingOffset,
    headingIdPrefix,
    callouts,
    omitTitleHeading,
    output: _output,
    ...preparationOptions
  } = getNativeMarkdownCompileOptions(markdownConfig, { format })
  const prepared = getJsxCompiler(markdownConfig).prepare(source, preparationOptions)
  const frontmatter = parseNativeFrontmatter(
    prepared.metadata.frontMatter,
    prepared.metadata.frontMatterKind
  )
  const title = typeof frontmatter.title === "string" ? frontmatter.title : undefined
  const renderOptions: JsxRenderOptions = {
    calloutComponents,
    codeComponents,
    codeBlockComponent,
    componentPrefix,
    headingIds,
    headingOffset,
    headingIdPrefix,
    callouts,
    omitTitleHeading: title == null || title === "" ? omitTitleHeading : title,
  }
  return { prepared, frontmatter, renderOptions }
}

/** Normalize final rendered heading spans for route-manifest/search content. */
export function createNativeMarkdownMetadata(
  source: string,
  frontmatter: Record<string, unknown>,
  compiled: JsxModuleResult | JsxResult
): NativeMarkdownMetadata {
  const removedRanges = [
    ...(compiled.frontMatterSpan == null ? [] : [compiled.frontMatterSpan]),
    ...(compiled.omittedTitleHeadingSpan == null ? [] : [compiled.omittedTitleHeadingSpan]),
  ].sort((left, right) => left.start - right.start)
  const sourceBytes = Buffer.from(source, "utf8")
  const contentBytes = removeRanges(sourceBytes, removedRanges)
  const content = new TextDecoder().decode(contentBytes)

  return {
    content,
    frontmatter,
    headings: compiled.headings.map((heading) => {
      const removedBeforeStart = removedRanges.reduce(
        (total, range) => total + (range.end <= heading.start ? range.end - range.start : 0),
        0
      )
      const removedBeforeEnd = removedRanges.reduce(
        (total, range) => total + (range.end <= heading.end ? range.end - range.start : 0),
        0
      )

      return {
        ...heading,
        start: heading.start - removedBeforeStart,
        end: heading.end - removedBeforeEnd,
      }
    }),
  }
}

/** Parse YAML metadata discovered by Ferromark's native frontmatter parser. */
export function readNativeMarkdownFrontmatter(
  source: string,
  format: NativeMarkdownFormat
): Record<string, unknown> {
  const { metadata: result } = getJsxCompiler().prepare(source, { format, frontMatter: true })
  return parseNativeFrontmatter(result.frontMatter, result.frontMatterKind)
}

export function parseNativeFrontmatter(
  source: string | undefined,
  kind: "toml" | "yaml" | undefined
): Record<string, unknown> {
  if (source == null) return {}
  if (kind !== "yaml") {
    throw new Error(
      `[ardo] ${kind ?? "Unknown"} frontmatter is not supported in Ardo routes; use YAML frontmatter.`
    )
  }
  if (source.trim() === "") return {}

  const value: unknown = parseYaml(source)
  if (!isRecord(value)) {
    throw new Error("[ardo] YAML frontmatter must contain a mapping of fields.")
  }
  if (Object.keys(value).some((key) => key.trim() === "")) {
    throw new Error("[ardo] YAML frontmatter field names must not be empty.")
  }

  return value
}

function removeRanges(
  source: Uint8Array,
  ranges: ReadonlyArray<{ start: number; end: number }>
): Uint8Array {
  if (ranges.length === 0) return source

  const slices: Uint8Array[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor || range.end < range.start || range.end > source.length) {
      throw new Error("[ardo] Ferromark returned an invalid Markdown source range.")
    }

    slices.push(source.subarray(cursor, range.start))
    cursor = range.end
  }
  slices.push(source.subarray(cursor))

  const content = new Uint8Array(slices.reduce((length, slice) => length + slice.length, 0))
  let offset = 0
  for (const slice of slices) {
    content.set(slice, offset)
    offset += slice.length
  }
  return content
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}
