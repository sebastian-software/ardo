import type { JsxResult } from "ferromark"

import type { MarkdownConfig } from "../config/markdown"
import type { NativeMarkdownMetadata } from "../markdown/native-metadata"

export type ModuleBodyNode = Record<string, unknown>

export type EsmBlock = {
  body: ModuleBodyNode[]
  end: number
  start: number
  value: string
}

export type ModuleScope = {
  bindings: Set<string>
  blocks: EsmBlock[]
  exportedNames: Set<string>
  identifiers: Set<string>
}

export type AuthoredLayout = {
  expression?: string
  importStatement?: string
  localBinding?: string
}

export type ModuleNames = {
  authoredLayout: string
  components: string
  content: string
  frontmatter: string
  mermaid: string
  pageDataProvider: string
  route: string
  toc: string
  useComponents: string
}

export type NativeMap = {
  file?: string
  mappings: string
  names: string[]
  sources: string[]
  sourcesContent?: Array<null | string>
  version: 3
}

export type GeneratedModuleInput = {
  id: string
  markdownConfig: MarkdownConfig | undefined
  metadata: NativeMarkdownMetadata
  moduleScope: ModuleScope
  names: ModuleNames
  result: JsxResult
  source: string
}
