import type { Plugin } from "vite"

import { readFileSync } from "node:fs"
import { setImmediate as nextTurn } from "node:timers/promises"

import type { ArdoConfig } from "../config/types"

import { compileMdxRouteModule } from "./mdx-compile"
import { resolveRoutesDir } from "./path-utils"
import { scanRoutesSync } from "./routes-core"

export type MarkdownWarmup = {
  /** Languages whose grammars are loaded now. */
  languages: string[]
  durationMs: number
}

const FENCE_INFO = /^(?:`{3,}|~{3,})[ \t]*([\w#+.-]+)/gmu

/** Languages named by the fenced code blocks of a project's Markdown routes. */
export function collectFenceLanguages(routesDir: string): string[] {
  const languages = new Set<string>()
  for (const route of scanRoutesSync({ dir: routesDir, rootDir: routesDir })) {
    if (!/\.mdx?$/u.test(route.filePath)) continue
    for (const match of readFileSync(route.filePath, "utf8").matchAll(FENCE_INFO)) {
      languages.add((match[1] ?? "").toLowerCase())
    }
  }
  return [...languages].sort()
}

/**
 * Compile one small code block per language, so Ferriki loads and compiles
 * its grammars before the build reaches the real pages. One language per
 * event loop turn, so other work started meanwhile keeps being served.
 */
export async function warmMarkdownHighlighting(input: {
  languages: string[]
  markdownConfig: ArdoConfig["markdown"]
}): Promise<MarkdownWarmup> {
  const start = performance.now()
  const languages: string[] = []
  for (const language of input.languages) {
    await nextTurn()
    compileMdxRouteModule({
      format: "md",
      id: `ardo-warmup-${language}.md`,
      markdownConfig: input.markdownConfig,
      source: `# Warm-up\n\n\`\`\`${language}\nconst answer = 42\n\`\`\`\n`,
    })
    languages.push(language)
  }
  return { languages, durationMs: performance.now() - start }
}

/**
 * Warm the Markdown highlighter when the build starts, before the first page
 * compiles. The warm-up takes about a quarter of a second for the docs; the
 * first compile of all pages then costs about half as much as cold, which
 * saves more than the warm-up takes. It runs after the config phase on
 * purpose: during the native API extraction it would delay the compiler's
 * replies, which costs more than the overlap gains.
 */
export function createMarkdownWarmupPlugin(
  markdownConfig: ArdoConfig["markdown"],
  routesDirOption: string | undefined
): Plugin {
  let routesDir = resolveRoutesDir(process.cwd(), routesDirOption)
  let warmup: Promise<MarkdownWarmup> | undefined
  return {
    name: "ardo:markdown-warmup",
    configResolved(config) {
      routesDir = resolveRoutesDir(config.root, routesDirOption)
    },
    async buildStart() {
      warmup ??= warmMarkdownHighlighting({
        languages: collectFenceLanguages(routesDir),
        markdownConfig,
      })
      await warmup
    },
  }
}
