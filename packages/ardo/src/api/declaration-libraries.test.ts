import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractDeclarations, generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-libraries-")))
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

async function errorLibraries(): Promise<string> {
  await declaration(
    "lib.es5.d.ts",
    [
      "interface Error { name: string; message: string; stack?: string; }",
      "interface TypeError extends Error {}",
      "interface ErrorConstructor { readonly prototype: Error; }",
      "declare var Error: ErrorConstructor;",
      "type Partial<T> = { [P in keyof T]?: T[P] };",
      "type Pick<T, K extends keyof T> = { [P in K]: T[P] };",
    ].join("\n")
  )
  await declaration(
    "lib.es2022.error.d.ts",
    "/// <reference path='./lib.es2022.d.ts' />\ninterface Error { /** The original failure. */ cause?: unknown; }"
  )
  return declaration(
    "lib.es2022.d.ts",
    "/// <reference lib=\"es5\" />\n/// <reference lib='es2022.error' />"
  )
}

describe("compiler declaration libraries", () => {
  it("keeps global bases incomplete until matching libraries are supplied", async () => {
    await errorLibraries()
    const entry = await declaration("api.d.ts", "export declare class Failure extends Error {}")
    const result = await extractDeclarations([entry])
    expect(result.items[0].propertiesComplete).toBe(false)
    expect(result.diagnostics[0].message).toContain("properties of Error")
    expect(result.files).toStrictEqual([entry])
  })

  it("merges referenced global interfaces, follows cycles, and excludes constructor values", async () => {
    const library = await errorLibraries()
    const entry = await declaration(
      "api.d.ts",
      "export declare class Failure extends TypeError { readonly code: string; }"
    )
    const result = await generateDeclarationDocs(
      { entryPoints: [entry], libFiles: [library, path.join(temporary, "lib.es5.d.ts")] },
      path.join(temporary, "routes")
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual(["Failure"])
    expect(result.items[0]).toMatchObject({
      propertiesComplete: true,
      properties: [
        { name: "name", type: "string", optional: false },
        { name: "message", type: "string", optional: false },
        { name: "stack", type: "string", optional: true },
        {
          name: "cause",
          type: "unknown",
          optional: true,
          comment: { description: "The original failure." },
        },
        { name: "code", type: "string", readonly: true },
      ],
    })
    expect(result.files).toHaveLength(4)
    expect(result.pages).toHaveLength(2)
    expect(result.pages.find((page) => page.path === "classes/failure.md")?.content).toContain(
      "The original failure."
    )
  })

  it("substitutes global generic bases and reads each augmentation in its original file", async () => {
    const first = await declaration(
      "base.d.ts",
      "interface Parent<T> { parent: T; }\ninterface Base<T = string> extends Parent<T[]> { /** Stored value. */ value: T; }"
    )
    const second = await declaration(
      "augmentation.d.ts",
      "interface Base<T = string> { /** Read the value. @param fallback - The fallback value. */ read(fallback: T): T; }\ntype SelectedFields = 'value';"
    )
    const entry = await declaration(
      "api.d.ts",
      "export interface Numeric extends Base<number> {}\nexport interface Default extends Base {}\nexport interface Selected extends Pick<Base<boolean>, SelectedFields> {}"
    )
    const result = await extractDeclarations([entry], { libFiles: [first, second] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([
      { name: "parent", type: "number[]" },
      { name: "value", type: "number", comment: { description: "Stored value." } },
      {
        name: "read",
        comment: { description: "Read the value." },
        signatures: [
          {
            returnType: "number",
            parameters: [{ type: "number", description: "The fallback value." }],
          },
        ],
      },
    ])
    expect(result.items[1].properties[1].type).toBe("string")
    expect(result.items[2].properties).toMatchObject([{ name: "value", type: "boolean" }])
  })

  it("keeps utility expansion when the libraries declare the built-in mapped types", async () => {
    const library = await errorLibraries()
    const entry = await declaration(
      "api.d.ts",
      "export interface Options extends Partial<Pick<Error, 'message' | 'cause'>> {}"
    )
    const result = await extractDeclarations([entry], { libFiles: [library] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      propertiesComplete: true,
      properties: [
        { name: "message", type: "string", optional: true },
        { name: "cause", type: "unknown", optional: true },
      ],
    })
  })

  it("retains documented overloads across global interface augmentations", async () => {
    const first = await declaration(
      "base.d.ts",
      "interface Reader { /** Read a value. @param value - The stored value. */ read(value: string): string; }"
    )
    const second = await declaration(
      "augmentation.d.ts",
      "interface Reader { read(value: number): number; }"
    )
    const entry = await declaration("api.d.ts", "export interface PublicReader extends Reader {}")
    const result = await extractDeclarations([entry], { libFiles: [first, second] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties[0]).toMatchObject({
      name: "read",
      comment: { description: "Read a value." },
      signatures: [
        { returnType: "string", parameters: [{ description: "The stored value." }] },
        { returnType: "number" },
      ],
    })
  })

  it("prefers local and imported names over global declarations", async () => {
    const library = await errorLibraries()
    await declaration("other.d.ts", "export interface Error { imported: number; }")
    const entry = await declaration(
      "api.d.ts",
      "import type { Error as ImportedError } from './other.js';\ninterface Error { local: boolean; }\nexport interface Local extends Error {}\nexport interface Imported extends ImportedError {}"
    )
    const result = await extractDeclarations([entry], { libFiles: [library] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([{ name: "local", type: "boolean" }])
    expect(result.items[1].properties).toMatchObject([{ name: "imported", type: "number" }])
  })

  it("does not replace an unresolved imported type with a same-named global", async () => {
    const library = await errorLibraries()
    const entry = await declaration(
      "api.d.ts",
      "import type { Error } from 'missing';\nexport interface Failure extends Error {}"
    )
    const result = await extractDeclarations([entry], { libFiles: [library] })
    expect(result.items[0]).toMatchObject({ propertiesComplete: false, properties: [] })
    expect(result.diagnostics[0].message).toContain("properties of Error")
  })

  it("ignores reference-like strings, block comments, and directives after declarations", async () => {
    const library = await declaration(
      "base.d.ts",
      "/* /// <reference path='missing.d.ts' /> */\ninterface Base { value: \"/// <reference lib='missing' />\"; }\n/// <reference path='missing.d.ts' />"
    )
    const entry = await declaration("api.d.ts", "export interface Child extends Base {}")
    const result = await extractDeclarations([entry], { libFiles: [library] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.files).toStrictEqual([library, entry])
    expect(result.items[0].propertiesComplete).toBe(true)
  })

  it("reports unsupported package-based ambient references", async () => {
    const library = await declaration(
      "base.d.ts",
      '/// <reference types="ambient-package" />\ninterface Base { value: string; }'
    )
    const entry = await declaration("api.d.ts", "export interface Child extends Base {}")
    const result = await extractDeclarations([entry], { libFiles: [library] })
    expect(result.diagnostics).toMatchObject([
      { file: library, message: 'Ambient types reference "ambient-package" is not supported.' },
    ])
  })

  it.each(["mts", "cts"])(
    "does not expose .d.%s module declarations as globals",
    async (extension) => {
      const library = await declaration(`base.d.${extension}`, "interface Base { value: string; }")
      const entry = await declaration("api.d.ts", "export interface Child extends Base {}")
      await expect(extractDeclarations([entry], { libFiles: [library] })).rejects.toThrow(
        "global declarations"
      )
    }
  )

  it.each([
    ["missing library", undefined, "ENOENT"],
    ["missing reference", "/// <reference lib='missing' />", "ENOENT"],
    ["external module", "interface Base { value: string; } export {};", "global declarations"],
    ["invalid library", "interface Broken {", "Could not parse"],
    ["invalid lib reference", "/// <reference lib='../missing' />", "Invalid compiler lib"],
  ])("preserves generated output when a %s cannot be loaded", async (_name, source, message) => {
    const entry = await declaration("api.d.ts", "export interface Options { value: string; }")
    await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    const output = path.join(temporary, "api-reference/interfaces/options.md")
    const previous = await fs.readFile(output, "utf8")
    const library =
      source == null ? path.join(temporary, "missing.d.ts") : await declaration("base.d.ts", source)
    await expect(
      generateDeclarationDocs({ entryPoints: [entry], libFiles: [library] }, temporary)
    ).rejects.toThrow(message)
    expect(await fs.readFile(output, "utf8")).toBe(previous)
  })
})
