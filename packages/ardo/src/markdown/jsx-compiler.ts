import { JsxCompiler } from "ferromark"

import type { MarkdownConfig } from "../config/types"

// Cache compiler/highlighter resources only; prepared native documents stay local
// to each read or transform and cannot retain stale HMR source or metadata.
const jsxCompilers = new Map<string, JsxCompiler>()

export function getJsxCompiler(markdownConfig: MarkdownConfig = {}): JsxCompiler {
  const theme = markdownConfig.theme
  const lineNumbers = markdownConfig.lineNumbers ?? false
  const cacheKey = `${theme === undefined ? "default-pair" : JSON.stringify(theme)}\u0000${lineNumbers}`
  let compiler = jsxCompilers.get(cacheKey)
  if (compiler == null) {
    compiler = new JsxCompiler({
      ...(theme === undefined ? {} : { theme }),
      lineNumbers,
    })
    jsxCompilers.set(cacheKey, compiler)
  }
  return compiler
}
