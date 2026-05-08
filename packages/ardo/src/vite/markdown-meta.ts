import type { ResolvedConfig } from "../config/types"

type MarkdownMetaState = {
  resolvedConfig?: ResolvedConfig
  routesDir: string
}

export function transformMarkdownMeta(
  code: string,
  id: string,
  state: MarkdownMetaState
): { code: string; map: null } | undefined {
  if (!shouldInjectMeta(code, id, state)) {
    return undefined
  }

  const pageTitle = extractFrontmatterValue(code, "title")
  if (pageTitle == null || pageTitle === "") {
    return undefined
  }

  const siteTitle = state.resolvedConfig?.title ?? "Ardo"
  const titleSeparator = state.resolvedConfig?.titleSeparator ?? " | "
  const description = extractFrontmatterValue(code, "description")
  const entries = buildMetaEntries({
    pageTitle,
    siteTitle,
    titleSeparator,
    description,
  })
  return { code: `${code}\nexport const meta = () => [${entries.join(", ")}];\n`, map: null }
}

function shouldInjectMeta(code: string, id: string, state: MarkdownMetaState): boolean {
  return isMarkdownFile(id) && id.startsWith(state.routesDir) && !hasMetaExport(code)
}

function buildMetaEntries(input: {
  pageTitle: string
  siteTitle: string
  titleSeparator: string
  description?: string
}): string[] {
  const fullTitle = `${input.pageTitle}${input.titleSeparator}${input.siteTitle}`
  const entries = [`{ title: ${JSON.stringify(fullTitle)} }`]
  if (input.description != null && input.description !== "") {
    entries.push(`{ name: "description", content: ${JSON.stringify(input.description)} }`)
  }

  return entries
}

function isMarkdownFile(id: string): boolean {
  return id.endsWith(".md") || id.endsWith(".mdx")
}

function hasMetaExport(code: string): boolean {
  return code.includes("export const meta") || code.includes("export function meta")
}

function extractFrontmatterValue(code: string, key: string): string | undefined {
  const frontmatterStart = code.indexOf("export const frontmatter")
  if (frontmatterStart === -1) {
    return undefined
  }

  const valuePrefix = `${key}: "`
  const valueStart = code.indexOf(valuePrefix, frontmatterStart)
  if (valueStart === -1) {
    return undefined
  }

  const startIndex = valueStart + valuePrefix.length
  const endIndex = code.indexOf('"', startIndex)
  if (endIndex === -1) {
    return undefined
  }

  return code.slice(startIndex, endIndex)
}
