import type { Root } from "hast"
import type { ShikiTransformer } from "shiki"

import { visit } from "unist-util-visit"

import { parseHighlightLines, parseLabel, parseTitle } from "./shiki-meta"

/**
 * Remark plugin that extracts code fence meta info and stores it as HAST
 * data attributes before MDX compilation can corrupt it.
 */
export function remarkCodeMeta() {
  return function (tree: Root): void {
    visit(tree, "code", (node: { data?: Record<string, unknown>; meta?: null | string }) => {
      const meta = node.meta
      if (meta == null || meta.length === 0) {
        return
      }

      const data = ensureNodeData(node)
      const hProperties = ensureRecord(data.hProperties)

      // Preserve meta as metastring property on the <code> HAST element.
      // @shikijs/rehype reads head.properties.metastring and passes it
      // to Shiki as meta.__raw, which ardoLineTransformer reads.
      hProperties.metastring = meta
      data.hProperties = hProperties

      // Strip meta from the MDAST node to prevent MDX from
      // misinterpreting {expressions} like {2,4-5} as JSX.
      node.meta = null
    })
  }
}

function ensureNodeData(node: { data?: Record<string, unknown> }): Record<string, unknown> {
  node.data ??= {}
  return node.data
}

function ensureRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

interface ArdoLineTransformerOptions {
  globalLineNumbers?: boolean
}

interface LineTransformerState {
  highlightLines: number[]
  metaRaw: string
  showLineNumbers: boolean
}

interface TransformerNode {
  properties?: Record<string, unknown>
}

/**
 * Shiki transformer that adds line highlighting, line numbers, and title
 * attributes to code blocks in the MDX pipeline.
 */
export function ardoLineTransformer(options: ArdoLineTransformerOptions = {}): ShikiTransformer {
  const state: LineTransformerState = {
    highlightLines: [],
    metaRaw: "",
    showLineNumbers: false,
  }

  return {
    name: "ardo:lines",
    preprocess(_code, shikiOptions) {
      const metaRaw = getMetaRaw(shikiOptions.meta)
      state.metaRaw = metaRaw
      state.highlightLines = parseHighlightLines(metaRaw)
      state.showLineNumbers =
        (options.globalLineNumbers ?? false) || metaRaw.includes("showLineNumbers")
    },
    pre(node) {
      const properties = ensureNodeProperties(node)
      applyTitleProperty(properties, state.metaRaw)
      applyLabelProperty(properties, state.metaRaw)
    },
    line(node, line) {
      const properties = ensureNodeProperties(node)
      applyHighlightedLineClass(properties, state.highlightLines, line)

      if (state.showLineNumbers) {
        properties["data-ln"] = String(line)
      }
    },
  }
}

function getMetaRaw(meta: unknown): string {
  if (!isRecord(meta)) {
    return ""
  }

  const raw = meta.__raw
  return typeof raw === "string" ? raw : ""
}

function ensureNodeProperties(node: TransformerNode): Record<string, unknown> {
  node.properties ??= {}
  return node.properties
}

function applyTitleProperty(properties: Record<string, unknown>, metaRaw: string): void {
  const title = parseTitle(metaRaw)
  if (title != null && title.length > 0) {
    properties["data-title"] = title
  }
}

function applyLabelProperty(properties: Record<string, unknown>, metaRaw: string): void {
  const label = parseLabel(metaRaw)
  if (label != null && label.length > 0) {
    properties["data-label"] = label
  }
}

function applyHighlightedLineClass(
  properties: Record<string, unknown>,
  highlightLines: number[],
  line: number
): void {
  if (!highlightLines.includes(line)) {
    return
  }

  const currentClass = typeof properties.class === "string" ? properties.class : ""
  properties.class = currentClass.length > 0 ? `${currentClass} highlighted` : "highlighted"
}
