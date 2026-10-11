import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractDeclarations, generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-members-"))
})
afterEach(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

async function declaration(source: string): Promise<string> {
  const file = path.join(temporary, "api.d.ts")
  await fs.writeFile(file, source)
  return file
}

describe("expanded declaration members", () => {
  it("retains method documentation across undocumented overloads", async () => {
    const entry = await declaration(
      [
        "export declare class Compiler {",
        "  /** Compile a module. @param source - Authored source. */",
        "  compile(source: string, module: true): { code: string };",
        "  compile(source: string): string;",
        "}",
        "export interface Reader {",
        "  read(value: string): string;",
        "  /** Read a number. */ read(value: number): number;",
        "  read(value: boolean): boolean;",
        "}",
      ].join("\n")
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    const compile = result.items.find((item) => item.name === "Compiler")?.properties[0]
    expect(compile?.comment.description).toBe("Compile a module.")
    expect(compile?.signatures).toHaveLength(2)
    expect(compile?.signatures[0].parameters[0].description).toBe("Authored source.")
    expect(result.pages.find((page) => page.path === "classes/compiler.md")?.content).toContain(
      "Compile a module."
    )
    const read = result.items.find((item) => item.name === "Reader")?.properties[0]
    expect(read?.comment.description).toBe("Read a number.")
    expect(read?.signatures.map((signature) => signature.returnType)).toStrictEqual([
      "string",
      "number",
      "boolean",
    ])
  })

  it("expands finite Record keys and substitutes generic values", async () => {
    const entry = await declaration(
      [
        "type Fields<T> = Record<'primary' | 'secondary', T>;",
        "export type Labels = Readonly<Fields<string | number>>;",
        "export type Empty = Record<never, boolean>;",
        "export type Numeric = Record<1 | 2, boolean>;",
      ].join("\n")
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.find((item) => item.name === "Labels")).toMatchObject({
      propertiesComplete: true,
      properties: [
        { name: "primary", kind: "property", type: "(string | number)", readonly: true },
        { name: "secondary", kind: "property", type: "(string | number)", readonly: true },
      ],
    })
    expect(result.items.find((item) => item.name === "Empty")).toMatchObject({
      properties: [],
      propertiesComplete: true,
    })
    expect(result.items.find((item) => item.name === "Numeric")?.properties).toMatchObject([
      { name: "1", type: "boolean" },
      { name: "2", type: "boolean" },
    ])
  })

  it("reports utility transformations on open index signatures instead of inventing their effective types", async () => {
    const entry = await declaration("export type Lookup = Partial<Record<string, number>>;")
    const result = await extractDeclarations([entry])
    expect(result.items[0]).toMatchObject({
      signature: "type Lookup = Partial<Record<string, number>>;",
      propertiesComplete: false,
    })
    expect(result.diagnostics[0].message).toContain("index signatures")
  })

  it("documents dictionary and index signatures without inventing required named properties", async () => {
    const entry = await declaration(
      [
        "export interface Frontmatter extends Record<string, unknown> { /** Page title. */ title?: string; }",
        "export interface Lookup { /** Values by numeric key. */ readonly [key: number]: boolean; }",
        "export declare class Values { /** Values by symbol. */ [key: symbol]: string; }",
      ].join("\n")
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.find((item) => item.name === "Frontmatter")).toMatchObject({
      propertiesComplete: true,
      properties: [
        { kind: "index", name: "[key: string]", type: "unknown" },
        { kind: "property", name: "title", optional: true },
      ],
    })
    expect(result.items.find((item) => item.name === "Lookup")?.properties).toMatchObject([
      { kind: "index", name: "[key: number]", type: "boolean", readonly: true },
    ])
    const lookup = result.pages.find((page) => page.path === "interfaces/lookup.md")?.content
    expect(lookup).toContain("## Index signatures")
    expect(lookup).toContain("readonly [key: number]: boolean")
    expect(lookup).toContain("Values by numeric key.")
    expect(lookup).not.toContain("| Required |")
    expect(result.items.find((item) => item.name === "Values")?.properties).toMatchObject([
      { kind: "index", name: "[key: symbol]", type: "string" },
    ])
  })

  it("keeps getter documentation and mutability independent of accessor order", async () => {
    const entry = await declaration(
      [
        "export declare class GetterFirst { /** Current value. */ get value(): string; set value(value: string); }",
        "export declare class SetterFirst { set value(value: string); /** Current value. */ get value(): string; }",
        "export declare class ReadOnly { /** Current value. */ get value(): string; }",
      ].join("\n")
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    for (const name of ["GetterFirst", "SetterFirst"]) {
      expect(result.items.find((item) => item.name === name)?.properties).toMatchObject([
        {
          name: "value",
          type: "string",
          readonly: false,
          comment: { description: "Current value." },
        },
      ])
    }
    expect(result.items.find((item) => item.name === "ReadOnly")?.properties).toMatchObject([
      { name: "value", readonly: true },
    ])
  })
})
