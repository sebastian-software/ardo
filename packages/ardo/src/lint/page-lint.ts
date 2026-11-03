import { parse as parseYaml } from "yaml"

import type { LintRuleId } from "../config/lint-rules"

import { validatePageFrontmatter } from "../vite/page-metadata"

/** A problem a rule found on one line of a page. The caller assigns the severity. */
export type LintFinding = {
  column?: number
  line: number
  message: string
  rule: LintRuleId
}

type Heading = { level: number; line: number; text: string }

type CodeBlock = {
  contentLines: Array<{ line: number; text: string }>
  language: string
  line: number
}

type OpenFence = { block: CodeBlock; marker: string }

type PageSource = {
  bodyIndex: number
  data: Record<string, unknown>
}

const shellLanguages = new Set(["bash", "sh", "shell", "zsh"])
const openingFence = /^\s*(`{3,}|~{3,})(.*)$/u
const closingFence = /^\s*(`{3,}|~{3,})\s*$/u
const atxHeading = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/u

/**
 * Run the authoring rules over one Markdown or MDX page's source. Headings and code fences are
 * read line by line, outside code fences, so line numbers match the file on disk.
 *
 * A page whose frontmatter cannot be parsed yields no findings here; `ardo check` reports it.
 */
export function lintPage(source: string): LintFinding[] {
  const lines = source.split(/\r?\n/u)
  const page = readPageSource(lines)
  if (page == null) return []

  const { frontmatter } = validatePageFrontmatter(page.data)
  const lintSetting = frontmatter.lint
  if (lintSetting === false) return []
  const disabled = typeof lintSetting === "object" ? (lintSetting.disable ?? []) : []

  const { codeBlocks, headings } = scanBody(lines, page.bodyIndex)
  const title =
    typeof frontmatter.title === "string" && frontmatter.title !== ""
      ? frontmatter.title
      : undefined

  return [
    ...missingDescription(frontmatter.description),
    ...multipleH1(headings, title),
    ...headingSkip(headings, title),
    ...codeLanguage(codeBlocks),
    ...shellPrompt(codeBlocks),
  ]
    .filter((finding) => !disabled.includes(finding.rule))
    .sort((left, right) => left.line - right.line)
}

function missingDescription(description: unknown): LintFinding[] {
  if (typeof description === "string" && description.trim() !== "") return []
  return [
    {
      line: 1,
      message: "Add a description to the frontmatter.",
      rule: "missing-description",
    },
  ]
}

/**
 * Ardo renders the frontmatter title as the page's H1 and omits the first body H1 when its
 * visible text equals that title, so that heading is not counted twice.
 */
function multipleH1(headings: Heading[], title: string | undefined): LintFinding[] {
  const bodyH1s = headings.filter((heading) => heading.level === 1)
  const [first] = bodyH1s
  const omitted =
    title !== undefined && first !== undefined && plainText(first.text) === title.trim()
  const renderedBodyH1s = omitted ? bodyH1s.slice(1) : bodyH1s
  const count = (title === undefined ? 0 : 1) + renderedBodyH1s.length
  if (count <= 1) return []

  const extra = title === undefined ? renderedBodyH1s.slice(1) : renderedBodyH1s
  const message =
    title === undefined
      ? `Page has ${count} H1 headings. Keep one H1 per page.`
      : `Page has ${count} H1 headings. Ardo renders the frontmatter title as the H1, so write sections as H2.`
  return [{ line: extra[0]?.line ?? 1, message, rule: "multiple-h1" }]
}

/**
 * Heading levels may not skip. The rendered title counts as H1; without a title, the first body
 * heading has no predecessor and is not compared.
 */
function headingSkip(headings: Heading[], title: string | undefined): LintFinding[] {
  const findings: LintFinding[] = []
  let previous = title === undefined ? 0 : 1
  for (const heading of headings) {
    if (previous > 0 && heading.level > previous + 1) {
      findings.push({
        line: heading.line,
        message: `Heading jumps from H${previous} to H${heading.level}. Use H${previous + 1} here.`,
        rule: "heading-skip",
      })
    }
    previous = heading.level
  }
  return findings
}

function codeLanguage(codeBlocks: CodeBlock[]): LintFinding[] {
  return codeBlocks
    .filter((block) => block.language === "")
    .map((block) => ({
      column: 1,
      line: block.line,
      message: "Code block has no language. Name it after the opening fence, such as ```ts.",
      rule: "code-language",
    }))
}

function shellPrompt(codeBlocks: CodeBlock[]): LintFinding[] {
  return codeBlocks
    .filter((block) => shellLanguages.has(block.language.toLowerCase()))
    .flatMap((block) =>
      block.contentLines
        .filter((content) => content.text.startsWith("$ "))
        .map((content) => ({
          column: 1,
          line: content.line,
          message: `Remove the "$ " prompt from this ${block.language} block so readers can copy the command.`,
          rule: "shell-prompt" as const,
        }))
    )
}

/**
 * Read the YAML frontmatter the way Ardo does: a `---` block at the top of the file. Returns
 * undefined when the block is not a YAML mapping.
 */
function readPageSource(lines: string[]): PageSource | undefined {
  if (lines[0]?.trimEnd() !== "---") return { bodyIndex: 0, data: {} }
  const closing = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---")
  if (closing === -1) return { bodyIndex: 0, data: {} }

  let value: unknown
  try {
    value = parseYaml(lines.slice(1, closing).join("\n"))
  } catch {
    return undefined
  }
  if (value == null) return { bodyIndex: closing + 1, data: {} }
  if (typeof value !== "object" || Array.isArray(value)) return undefined
  return { bodyIndex: closing + 1, data: { ...value } }
}

type BodyScan = {
  codeBlocks: CodeBlock[]
  headings: Heading[]
  open: OpenFence | undefined
}

/** Headings and code blocks of the body, with headings inside code fences left out. */
function scanBody(
  lines: string[],
  start: number
): { codeBlocks: CodeBlock[]; headings: Heading[] } {
  const scan: BodyScan = { codeBlocks: [], headings: [], open: undefined }
  for (const [offset, text] of lines.slice(start).entries()) {
    scanLine(scan, text, start + offset + 1)
  }
  return { codeBlocks: scan.codeBlocks, headings: scan.headings }
}

function scanLine(scan: BodyScan, text: string, line: number): void {
  if (scan.open != null) {
    if (isClosingFence(text, scan.open.marker)) scan.open = undefined
    else scan.open.block.contentLines.push({ line, text })
    return
  }

  const fence = openFence(text, line)
  if (fence != null) {
    scan.codeBlocks.push(fence.block)
    scan.open = fence
    return
  }

  const heading = readHeading(text, line)
  if (heading != null) scan.headings.push(heading)
}

function openFence(text: string, line: number): OpenFence | undefined {
  const fence = openingFence.exec(text)
  if (fence == null) return undefined
  const marker = fence[1] ?? ""
  const info = (fence[2] ?? "").trim()
  // A backtick fence cannot carry backticks in its info string, so such a line is inline code.
  if (marker[0] === "`" && info.includes("`")) return undefined
  return {
    block: { contentLines: [], language: /^[^\s{]*/u.exec(info)?.[0] ?? "", line },
    marker,
  }
}

/** A closing fence uses the same character and at least as many characters as the opening one. */
function isClosingFence(text: string, marker: string): boolean {
  const closing = closingFence.exec(text)?.[1] ?? ""
  return closing[0] === marker[0] && closing.length >= marker.length
}

function readHeading(text: string, line: number): Heading | undefined {
  const heading = atxHeading.exec(text)
  if (heading == null) return undefined
  return {
    level: (heading[1] ?? "").length,
    line,
    text: visibleHeadingText(heading[2] ?? ""),
  }
}

/** Heading text without the closing `#` sequence or a trailing `{#id}` attribute block. */
function visibleHeadingText(text: string): string {
  return text
    .replace(/(^|[ \t]+)#+$/u, "")
    .replace(/[ \t]*\{[#.][^}]*\}$/u, "")
    .trim()
}

/** Heading text as a reader sees it: links, emphasis markers, and character references resolved. */
function plainText(text: string): string {
  return text
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replaceAll(/[`*_]/gu, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .trim()
}
