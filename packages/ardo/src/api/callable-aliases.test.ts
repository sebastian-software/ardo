import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractDeclarations, generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-callables-"))
})
afterEach(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

async function declaration(file: string, source: string): Promise<string> {
  const absolute = path.join(temporary, file)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, source)
  return absolute
}

describe("callable declaration aliases", () => {
  it("renders documented parameters and returns while retaining the original type declaration", async () => {
    const entry = await declaration(
      "api.d.ts",
      [
        "/** Render content.",
        " * @param code - The source text.",
        " * @param language - The optional language.",
        " * @param values - Additional values.",
        " * @returns The rendered content.",
        " */",
        "export type Renderer = (code: string, language?: string | null, ...values: number[]) => string | undefined;",
      ].join("\n")
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      kind: "type",
      signatures: [
        {
          text: "(code: string, language?: string | null, ...values: number[]): string | undefined",
          returnType: "string | undefined",
          parameters: [
            { name: "code", type: "string", description: "The source text." },
            { name: "language", type: "string | null", optional: true },
            { name: "values", type: "number[]", rest: true },
          ],
        },
      ],
    })
    const page = result.pages.find((item) => item.path === "types/renderer.md")?.content
    expect(page).toContain("type Renderer = (code: string")
    expect(page).toContain("## Call signature")
    expect(page).toContain("### Parameters")
    expect(page).toContain("The optional language.")
    expect(page).toContain("The rendered content.")
    expect(result.pages.some((item) => item.path.startsWith("components/"))).toBe(false)
  })

  it("substitutes imported generic aliases, defaults, and alias-specific documentation", async () => {
    await declaration(
      "mapper.d.ts",
      "/** Map a value. @param input - The original value. @returns Mapped values. */ export type Mapper<T = string> = (input: T) => T[];"
    )
    const entry = await declaration(
      "api.d.ts",
      "import type { Mapper } from './mapper.js';\n/** Map numbers. @param input - The numeric value. @return Numeric results. */ export type Numbers = Mapper<number>;\nexport type Strings = Mapper;\nexport declare const mapNumbers: Numbers;"
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].signatures[0]).toMatchObject({
      returnType: "number[]",
      parameters: [{ type: "number", description: "The numeric value." }],
      comment: { tags: expect.arrayContaining([{ name: "return", text: "Numeric results." }]) },
    })
    expect(result.items[1].signatures[0]).toMatchObject({
      returnType: "string[]",
      parameters: [{ type: "string", description: "The original value." }],
    })
    expect(result.items[2]).toMatchObject({
      kind: "function",
      signatures: [{ text: "mapNumbers(input: number): number[]" }],
    })
    expect(result.pages.find((page) => page.path === "types/numbers.md")?.content).toContain(
      "type Numbers = Mapper<number>;"
    )
    expect(result.pages.find((page) => page.path === "types/numbers.md")?.content).toContain(
      "Numeric results."
    )
    expect(result.pages.find((page) => page.path === "types/numbers.md")?.content).not.toContain(
      "Mapped values."
    )
    expect(result.pages.find((page) => page.path === "types/strings.md")?.content).toContain(
      "Mapped values."
    )
  })

  it("retains per-overload documentation and named properties of a callable object", async () => {
    const entry = await declaration(
      "api.d.ts",
      [
        "/** Read values. */ export type Reader = {",
        "  /** Read text. @param value - The text value. @returns Read text. */ (value: string): string;",
        "  /** Read a number. @param value - The numeric value. @returns Read number. */ (value: number): number;",
        "  /** Reader label. */ readonly label: string;",
        "};",
      ].join("\n")
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      kind: "type",
      propertiesComplete: true,
      signatures: [
        { returnType: "string", parameters: [{ description: "The text value." }] },
        { returnType: "number", parameters: [{ description: "The numeric value." }] },
      ],
      properties: [{ name: "label", readonly: true }],
    })
    const page = result.pages.find((item) => item.path === "types/reader.md")?.content
    expect(page).toContain("Read text.")
    expect(page).toContain("Read a number.")
    expect(page).toContain("The numeric value.")
    expect(page).toContain("## Properties")
  })

  it("reads inherited interface call signatures and intersection overloads", async () => {
    const entry = await declaration(
      "api.d.ts",
      "interface Base<T> { (value: T): T; readonly label: string; }\nexport interface Reader extends Base<number> { (values: number[]): number[]; }\nexport type Combined = ((value: string) => string) & ((value: number) => number) & { enabled: boolean };"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      kind: "interface",
      propertiesComplete: true,
      signatures: [{ returnType: "number" }, { returnType: "number[]" }],
      properties: [{ name: "label", type: "string" }],
    })
    expect(result.items[1]).toMatchObject({
      kind: "type",
      signatures: [{ returnType: "string" }, { returnType: "number" }],
      properties: [{ name: "enabled", type: "boolean" }],
    })
  })

  it("keeps function generics and nested shadowed parameters independent of alias bindings", async () => {
    const entry = await declaration(
      "api.d.ts",
      "type Mapper<T> = <T>(value: T, callback: <T>(value: T) => T) => T;\nexport type Concrete = Mapper<string>;\nexport type Generic<T> = (value: T) => T;"
    )
    const result = await extractDeclarations([entry])
    expect(result.items[0].signatures[0]).toMatchObject({
      text: "<T>(value: T, callback: <T>(value: T) => T): T",
      returnType: "T",
      parameters: [{ type: "T" }, { type: "<T>(value: T) => T" }],
    })
    expect(result.items[1].signatures[0]).toMatchObject({
      returnType: "T",
      parameters: [{ type: "T" }],
    })
  })

  it("resolves typeof overload aliases and ReturnType of an aliased callable variable", async () => {
    const entry = await declaration(
      "api.d.ts",
      "declare function choose(value: string): string; declare function choose(value: number): number;\nexport type Choice = typeof choose;\ntype Factory = (name: string) => { name: string; id: number };\nexport declare const create: Factory;\nexport type Result = ReturnType<typeof create>;"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      kind: "type",
      signature: "type Choice = typeof choose;",
      signatures: [{ returnType: "string" }, { returnType: "number" }],
    })
    expect(result.items[1].signatures[0].returnType).toBe("{ name: string; id: number }")
    expect(result.items[2].properties.map((property) => property.name)).toStrictEqual([
      "name",
      "id",
    ])
  })

  it("preserves unions and constructors without inventing callable overloads or traversing member types", async () => {
    const entry = await declaration(
      "api.d.ts",
      "import type { Missing } from 'unavailable';\nexport type Either = ((value: string) => string) | ((value: number) => number);\nexport type Constructor = new (value: string) => { value: string };\nexport type Registry = { handler: (value: string) => string; missing: Missing };\nexport declare const registry: Registry;"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.files).toHaveLength(1)
    expect(result.items.every((item) => item.signatures.length === 0)).toBe(true)
    expect(result.items[0].signature).toContain("| ((value: number) => number)")
    expect(result.items[2].properties.map((property) => property.name)).toStrictEqual([
      "handler",
      "missing",
    ])
  })

  it("stops cyclic aliases while allowing finite nested generic aliases", async () => {
    const entry = await declaration(
      "api.d.ts",
      "type Identity<T> = T; type Wrapped<T> = Identity<T>;\nexport type Callback = Wrapped<Wrapped<(value: string) => number>>;\ntype Left = Right; type Right = Left; export type Cyclic = Left;\ntype Growing<T> = Growing<T[]>; export type ExpandedLoop = Growing<string>;"
    )
    const result = await extractDeclarations([entry])
    expect(result.items[0].signatures[0]).toMatchObject({
      returnType: "number",
      parameters: [{ type: "string" }],
    })
    expect(result.items[1].signatures).toStrictEqual([])
    expect(result.items[0].propertiesComplete).toBe(true)
    expect(result.items[2].signatures).toStrictEqual([])
    expect(result.diagnostics.some((item) => item.message.includes("Recursive expansion"))).toBe(
      true
    )
  })

  it("extracts the published Ferromark renderer as a callable type", async () => {
    const entry = fileURLToPath(
      new URL("../../node_modules/ferromark/index.d.mts", import.meta.url)
    )
    const result = await extractDeclarations([entry])
    const renderer = result.items.find((item) => item.name === "JsxCodeRenderer")
    expect(renderer).toMatchObject({
      kind: "type",
      signatures: [
        {
          returnType: "string | null | undefined",
          parameters: [
            { name: "code", type: "string", optional: false },
            { name: "language", type: "string | null", optional: true },
            { name: "meta", type: "string | null", optional: true },
          ],
        },
      ],
    })
  })

  it("excludes internal call signatures while retaining public overloads", async () => {
    const entry = await declaration(
      "api.d.ts",
      "export type Reader = { /** @internal */ (value: number): number; /** Read text. */ (value: string): string };"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].signatures).toMatchObject([
      { returnType: "string", comment: { description: "Read text." } },
    ])
    expect(result.items[0].signatures).toHaveLength(1)
  })
})
