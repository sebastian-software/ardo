import { parseSync } from "oxc-parser"
import { describe, expect, it } from "vitest"

import type { TypeShapeOptions } from "../../../../scripts/declaration-type-shape.mjs"

import { globalArrayNames, typeShape } from "../../../../scripts/declaration-type-shape.mjs"

function compared(value: string, options: TypeShapeOptions = { normalize: true }): unknown {
  const parsed = parseSync("compare.d.ts", `type Compared = ${value};`, {
    lang: "dts",
    astType: "ts",
  })
  const declaration = parsed.program.body[0]
  if (parsed.errors.length > 0 || declaration.type !== "TSTypeAliasDeclaration")
    throw new Error(`Cannot compare ${value}.`)
  return typeShape(declaration.typeAnnotation, options)
}

describe("documentation type comparison", () => {
  it.each([
    ["Array<string>", "string[]"],
    ["ReadonlyArray<string>", "readonly string[]"],
    ["Array<ReadonlyArray<string | number>>", "(readonly (number | string)[])[]"],
    ["Array<(value: string) => number>", "((value: string) => number)[]"],
    ["{ label?: string; readonly value: number }", "{ readonly value: number; label?: string }"],
    [
      "{ items: Array<{ start: number; end: number }> }",
      "{ items: { end: number; start: number }[] }",
    ],
    ['"inline" | "classic" | undefined', 'undefined | "classic" | "inline"'],
  ])("normalizes presentation of %s and %s", (left, right) => {
    expect(compared(left)).toStrictEqual(compared(right))
    expect(compared(left, {})).not.toStrictEqual(compared(right, {}))
  })

  it.each([
    ["readonly string[]", "string[]"],
    ["{ readonly value: number }", "{ value: number }"],
    ["{ value?: string }", "{ value: string }"],
    ["[string, number]", "[number, string]"],
    ["(left: string, right: number) => void", "(right: number, left: string) => void"],
    ["(...values: number[]) => void", "(values: number[]) => void"],
    [
      "{ (value: string): string; (value: number): number }",
      "{ (value: number): number; (value: string): string }",
    ],
    [
      "((value: string) => string) & ((value: number) => number)",
      "((value: number) => number) & ((value: string) => string)",
    ],
    ['"dark" | "light" | string', "string"],
    ["Response<string>", "Response<number>"],
  ])("retains meaningful differences between %s and %s", (left, right) => {
    expect(compared(left)).not.toStrictEqual(compared(right))
  })

  it("preserves duplicate property order", () => {
    expect(compared("{ value: string; value: number }")).not.toStrictEqual(
      compared("{ value: number; value: string }")
    )
  })

  it("preserves duplicate names written as identifiers and string keys", () => {
    expect(compared('{ value: string; "value": number }')).not.toStrictEqual(
      compared('{ "value": number; value: string }')
    )
  })

  it.each([
    "type Array<T> = { value: T };",
    "interface ReadonlyArray<T> { value: T }",
    "import type { List as Array } from './list.js';",
    "type Callback = <Array>(value: Array) => Array;",
  ])("detects shadowed global array names in %s", (source) => {
    const parsed = parseSync("shadow.d.ts", source, { lang: "dts", astType: "ts" })
    const arrayNames = globalArrayNames([parsed.program])
    const name = source.includes("ReadonlyArray") ? "ReadonlyArray" : "Array"
    expect(arrayNames).not.toContain(name)
    expect(compared(`${name}<string>`, { normalize: true, arrayNames })).not.toStrictEqual(
      compared(name === "Array" ? "string[]" : "readonly string[]")
    )
  })
})
