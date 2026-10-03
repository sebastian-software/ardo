import type { JsxResult } from "ferromark"
import type MagicString from "magic-string"

import { decode, encode, type SourceMapSegment } from "@jridgewell/sourcemap-codec"

import type { NativeMap } from "./mdx-types"

import { isRecord } from "./mdx-ast"

export function createModuleSourceMap(input: {
  bodyStartOffset: number
  generatedCode: string
  id: string
  magic: MagicString
  nativeMappings: JsxResult["mappings"]
}): NativeMap {
  const generated = input.magic.generateMap({
    file: input.id,
    hires: true,
    includeContent: true,
    source: input.id,
  })
  const map = parseNativeMap(generated.toString())
  addNativeMappings({
    bodyStartOffset: input.bodyStartOffset,
    generatedCode: input.generatedCode,
    map,
    nativeMappings: input.nativeMappings,
  })
  return map
}

function addNativeMappings(input: {
  bodyStartOffset: number
  generatedCode: string
  map: NativeMap
  nativeMappings: JsxResult["mappings"]
}): void {
  const decoded = decode(input.map.mappings)
  const bodyStart = positionAt(input.generatedCode, input.bodyStartOffset)

  for (const mapping of input.nativeMappings) {
    const generatedLine = bodyStart.line + mapping.generatedLine
    const generatedColumn =
      mapping.generatedColumn + (mapping.generatedLine === 0 ? bodyStart.column : 0)
    const line = decoded[generatedLine] ?? []
    const segment: SourceMapSegment = [generatedColumn, 0, mapping.sourceLine, mapping.sourceColumn]
    const insertionIndex = line.findIndex((item) => item[0] >= generatedColumn)
    if (insertionIndex !== -1 && line[insertionIndex]?.[0] === generatedColumn) {
      line[insertionIndex] = segment
    } else {
      line.splice(insertionIndex === -1 ? line.length : insertionIndex, 0, segment)
    }
    decoded[generatedLine] = line
  }

  input.map.mappings = encode(decoded)
}

function parseNativeMap(serialized: string): NativeMap {
  const value: unknown = JSON.parse(serialized)
  if (!isNativeMap(value)) throw new Error("[ardo] MagicString returned an invalid source map.")
  return value
}

function isNativeMap(value: unknown): value is NativeMap {
  return (
    isRecord(value) &&
    value.version === 3 &&
    typeof value.mappings === "string" &&
    isStringArray(value.names) &&
    isStringArray(value.sources) &&
    (value.file == null || typeof value.file === "string") &&
    (value.sourcesContent == null || isNullableStringArray(value.sourcesContent))
  )
}

function positionAt(source: string, offset: number): { column: number; line: number } {
  const before = source.slice(0, offset)
  const line = before.split("\n").length - 1
  return { column: before.length - (before.lastIndexOf("\n") + 1), line }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isNullableStringArray(value: unknown): value is Array<null | string> {
  return Array.isArray(value) && value.every((item) => item == null || typeof item === "string")
}
