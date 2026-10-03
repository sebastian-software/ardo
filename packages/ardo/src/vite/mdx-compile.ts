import { compileJsx, JsxCompiler, type JsxResult } from "ferromark"

import type { ArdoConfig } from "../config/types"
import type { NativeMap } from "./mdx-types"

import {
  getNativeMarkdownCompileOptions,
  type NativeMarkdownFormat,
  readNativeMarkdownMetadata,
} from "../markdown/native-metadata"
import { createMdxModule } from "./mdx-module"
import { allocateModuleNames, readModuleScope } from "./mdx-scope"

const jsxCompilers = new Map<string, JsxCompiler>()

export function compileMdxRouteModule(input: {
  format: NativeMarkdownFormat
  id: string
  markdownConfig: ArdoConfig["markdown"]
  source: string
}): { code: string; map: NativeMap } {
  const initial = compileJsx(
    input.source,
    getNativeMarkdownCompileOptions(input.markdownConfig, { format: input.format })
  )
  const scope = readModuleScope({
    body: initial.body,
    entries: initial.esm,
    filename: input.id,
    source: input.source,
  })
  const names = allocateModuleNames(scope)
  const metadata = readNativeMarkdownMetadata(input.source, input.format, input.markdownConfig)
  const result = compileFinalJsx({
    format: input.format,
    markdownConfig: input.markdownConfig,
    names,
    source: input.source,
    title: typeof metadata.frontmatter.title === "string" ? metadata.frontmatter.title : "",
  })
  return createMdxModule({
    id: input.id,
    markdownConfig: input.markdownConfig,
    metadata,
    moduleScope: scope,
    names,
    result,
    source: input.source,
  })
}

function compileFinalJsx(input: {
  format: NativeMarkdownFormat
  markdownConfig: ArdoConfig["markdown"]
  names: ReturnType<typeof allocateModuleNames>
  source: string
  title: string
}): JsxResult {
  const options = getNativeMarkdownCompileOptions(input.markdownConfig, {
    componentPrefix: input.names.components,
    codeBlockComponent: `${input.names.components}.CodeBlock`,
    format: input.format,
  })
  options.codeComponents = { mermaid: input.names.mermaid }
  const compileOptions =
    input.title === "" ? options : { ...options, omitTitleHeading: input.title }
  return getJsxCompiler(input.markdownConfig).compile(input.source, compileOptions)
}

function getJsxCompiler(markdownConfig: ArdoConfig["markdown"]): JsxCompiler {
  const theme = markdownConfig?.theme
  const lineNumbers = markdownConfig?.lineNumbers ?? false
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
