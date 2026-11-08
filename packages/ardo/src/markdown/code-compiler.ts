import { CodeCompiler } from "ferromark"

import type { MarkdownConfig } from "../config/types"

// Line numbers are a compiler-level choice. The compiler links no native
// plugins: highlighting and diagrams arrive as code hooks (see code-hooks.ts).
// Prepared native documents stay local to each read or transform and cannot
// retain stale HMR source or metadata.
const codeCompilers = new Map<boolean, CodeCompiler>()

export function getCodeCompiler(markdownConfig: MarkdownConfig = {}): CodeCompiler {
  const lineNumbers = markdownConfig.lineNumbers ?? false
  let compiler = codeCompilers.get(lineNumbers)
  if (compiler == null) {
    compiler = new CodeCompiler({ lineNumbers })
    codeCompilers.set(lineNumbers, compiler)
  }
  return compiler
}
