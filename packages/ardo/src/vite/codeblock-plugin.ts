import type { Plugin } from "vite"
import type { MarkdownConfig } from "../config/types"
import { highlightCode } from "../markdown/shiki"

/**
 * Strips leading/trailing blank lines and removes common leading whitespace.
 * Same logic as the runtime outdent in CodeBlock.tsx.
 */
function outdent(text: string): string {
  const trimmed = text.replace(/^\n+/, "").replace(/\n\s*$/, "")
  const lines = trimmed.split("\n")

  const indent = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min
    const match = line.match(/^(\s*)/)
    return match ? Math.min(min, match[1].length) : min
  }, Infinity)

  if (indent === 0 || indent === Infinity) return trimmed
  return lines.map((line) => line.slice(indent)).join("\n")
}

/**
 * Vite plugin that pre-highlights CodeBlock components with static props.
 *
 * Supports two patterns:
 * 1. `<CodeBlock code="..." language="..." />`
 * 2. `<CodeBlock language="...">{\`...\`}</CodeBlock>`
 *
 * Injects pre-rendered Shiki HTML as a `__html` prop so that syntax
 * highlighting works outside the MDX pipeline.
 */
export function ardoCodeBlockPlugin(markdownConfig?: MarkdownConfig): Plugin {
  return {
    name: "ardo:codeblock-highlight",
    enforce: "pre",

    async transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return
      if (!code.includes("CodeBlock")) return
      if (id.includes("node_modules")) return

      let result = code
      let offset = 0

      // Pattern 1: <CodeBlock code="..." language="..." />
      const propRegex = /<CodeBlock\s+([^>]*?)(?:\/>|>)/g
      let match: RegExpExecArray | null

      while ((match = propRegex.exec(code)) !== null) {
        const fullMatch = match[0]
        const propsStr = match[1]

        const codeMatch =
          propsStr.match(/\bcode="((?:[^"\\]|\\.)*)"/s) ||
          propsStr.match(/\bcode=\{"((?:[^"\\]|\\.)*)"\}/s)
        if (!codeMatch) continue

        const langMatch =
          propsStr.match(/\blanguage="([^"]*)"/) || propsStr.match(/\blanguage=\{"([^"]*)"\}/)
        if (!langMatch) continue

        if (propsStr.includes("__html")) continue

        const codeContent = codeMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
        const language = langMatch[1]

        try {
          const html = await highlightCode(codeContent, language, {
            theme: markdownConfig?.theme,
          })

          const escapedHtml = JSON.stringify(html)
          const newPropsStr = `__html={${escapedHtml}} ` + propsStr
          const newFullMatch = fullMatch.replace(propsStr, newPropsStr)

          result =
            result.slice(0, match.index + offset) +
            newFullMatch +
            result.slice(match.index + offset + fullMatch.length)

          offset += newFullMatch.length - fullMatch.length
        } catch {
          // If highlighting fails, leave unchanged
        }
      }

      // Pattern 2: <CodeBlock language="...">{\`...\`}</CodeBlock>
      // or <CodeBlock language="...">{`...`}</CodeBlock>
      const childrenRegex = /<CodeBlock\s+([^>]*?)>\s*\{`([\s\S]*?)`\}\s*<\/CodeBlock>/g

      // Reset for second pass — work on original code, apply to result
      offset = result.length - code.length
      while ((match = childrenRegex.exec(code)) !== null) {
        const fullMatch = match[0]
        const propsStr = match[1]
        const rawChildren = match[2]

        const langMatch =
          propsStr.match(/\blanguage="([^"]*)"/) || propsStr.match(/\blanguage=\{"([^"]*)"\}/)
        if (!langMatch) continue

        if (propsStr.includes("__html")) continue

        const codeContent = outdent(rawChildren)
        const language = langMatch[1]

        try {
          const html = await highlightCode(codeContent, language, {
            theme: markdownConfig?.theme,
          })

          const escapedHtml = JSON.stringify(html)
          // Rewrite to self-closing tag with __html and code props
          const newTag = `<CodeBlock __html={${escapedHtml}} code={${JSON.stringify(codeContent)}} ${propsStr} />`

          result =
            result.slice(0, match.index + offset) +
            newTag +
            result.slice(match.index + offset + fullMatch.length)

          offset += newTag.length - fullMatch.length
        } catch {
          // If highlighting fails, leave unchanged
        }
      }

      if (result !== code) {
        return { code: result, map: null }
      }
    },
  }
}
