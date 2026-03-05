import type { Plugin } from "vite"

import type { MarkdownConfig } from "../config/types"

import { transformArdoCodeBlocks } from "./codeblock-transform"

/**
 * Vite plugin that pre-highlights ArdoCodeBlock components at build time.
 *
 * Runs before the JSX parser, so children can contain arbitrary code
 * (including `<`, `{`, etc.) without causing syntax errors.
 */
export function ardoCodeBlockPlugin(markdownConfig?: MarkdownConfig): Plugin {
  return {
    enforce: "pre",
    name: "ardo:codeblock-highlight",

    async transform(code, id) {
      if (!shouldProcessFile(code, id)) {
        return
      }

      const transformed = await transformArdoCodeBlocks(code, markdownConfig)
      if (transformed === code) {
        return
      }

      return {
        code: transformed,
        map: null,
      }
    },
  }
}

function shouldProcessFile(code: string, id: string): boolean {
  if (!/\.[jt]sx$/u.test(id)) {
    return false
  }

  if (id.includes("node_modules")) {
    return false
  }

  return code.includes("ArdoCodeBlock")
}
