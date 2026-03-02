import type { Plugin } from "vite"
import type { MarkdownConfig } from "../config/types"
import { highlightCode } from "../markdown/shiki"

/**
 * Vite plugin that pre-highlights CodeBlock components with static props.
 *
 * Scans .tsx/.jsx files for `<CodeBlock code="..." language="..." />` usages
 * and injects pre-rendered Shiki HTML as a `__html` prop so that syntax
 * highlighting works outside the MDX pipeline.
 */
export function ardoCodeBlockPlugin(markdownConfig?: MarkdownConfig): Plugin {
  return {
    name: "ardo:codeblock-highlight",
    enforce: "pre",

    async transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return
      if (!code.includes("CodeBlock")) return
      // Skip node_modules
      if (id.includes("node_modules")) return

      // Match <CodeBlock ... code="..." ... language="..." ... />
      // or <CodeBlock ... code={"..."} ... language={"..."} ... />
      // Supports both self-closing and opening tags
      const codeBlockRegex = /<CodeBlock\s+([^>]*?)(?:\/>|>)/g
      let match: RegExpExecArray | null
      let result = code
      let offset = 0

      while ((match = codeBlockRegex.exec(code)) !== null) {
        const fullMatch = match[0]
        const propsStr = match[1]

        // Extract code prop (supports code="..." and code={"..."})
        const codeMatch =
          propsStr.match(/\bcode="((?:[^"\\]|\\.)*)"/s) ||
          propsStr.match(/\bcode=\{"((?:[^"\\]|\\.)*)"\}/s)
        if (!codeMatch) continue

        // Extract language prop
        const langMatch =
          propsStr.match(/\blanguage="([^"]*)"/) || propsStr.match(/\blanguage=\{"([^"]*)"\}/)
        if (!langMatch) continue

        // Skip if there's already a __html prop
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

          // Escape the HTML for embedding as a JSX string prop
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

      if (result !== code) {
        return { code: result, map: null }
      }
    },
  }
}
