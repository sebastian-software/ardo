interface CodeBlockOptions {
  highlightLines: number[]
  lang: string
  lineNumbers: boolean
  title?: string
}

export function buildCodeBlockHtml(shikiHtml: string, options: CodeBlockOptions): string {
  const titleHtml = renderTitle(options.title)
  const codeHtml = renderCodeLines({
    highlightLines: options.highlightLines,
    lineNumbers: options.lineNumbers,
    shikiHtml,
  })
  const copyButton = renderCopyButton(shikiHtml)

  return `${titleHtml}<div data-lang="${options.lang}">${codeHtml}${copyButton}</div>`
}

function renderTitle(title: string | undefined): string {
  if (title == null || title.length === 0) {
    return ""
  }

  return `<div data-title>${escapeHtml(title)}</div>`
}

function renderCodeLines(params: {
  highlightLines: number[]
  lineNumbers: boolean
  shikiHtml: string
}): string {
  const { highlightLines, lineNumbers, shikiHtml } = params
  if (!lineNumbers && highlightLines.length === 0) {
    return shikiHtml
  }

  return shikiHtml
    .split("\n")
    .map((lineHtml, index) =>
      renderSingleCodeLine({
        highlightLines,
        lineHtml,
        lineNumber: index + 1,
        lineNumbers,
      })
    )
    .join("\n")
}

function renderSingleCodeLine(params: {
  highlightLines: number[]
  lineHtml: string
  lineNumber: number
  lineNumbers: boolean
}): string {
  const { highlightLines, lineHtml, lineNumber, lineNumbers } = params
  const isHighlighted = highlightLines.includes(lineNumber)
  const className = isHighlighted ? "line highlighted" : "line"
  const lineNumberAttribute = lineNumbers ? ` data-ln="${lineNumber}"` : ""

  return `<span class="${className}"${lineNumberAttribute}>${lineHtml}</span>`
}

function renderCopyButton(shikiHtml: string): string {
  const code = encodeURIComponent(extractCodeFromHtml(shikiHtml))
  return `<button data-code="${code}">
    <span>Copy</span>
    <span style="display:none">Copied!</span>
  </button>`
}

function extractCodeFromHtml(html: string): string {
  return decodeCommonEntities(stripTags(html))
}

function stripTags(html: string): string {
  let result = ""
  let inTag = false

  for (const char of html) {
    if (char === "<") {
      inTag = true
      continue
    }

    if (inTag && char === ">") {
      inTag = false
      continue
    }

    if (!inTag) {
      result += char
    }
  }

  return result
}

function decodeCommonEntities(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
