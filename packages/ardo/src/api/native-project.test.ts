import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  extractDeclarations,
  generateNativeDocs,
  NativeApiProject,
  NativeCompilerError,
} from "./index"

let temporary: string
const sessions: NativeApiProject[] = []
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-native-api-"))
})
afterEach(async () => {
  await Promise.all(sessions.splice(0).map(async (session) => session.close()))
  await fs.rm(temporary, { recursive: true, force: true })
})

async function write(file: string, text: string): Promise<string> {
  const absolute = path.join(temporary, file)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, text)
  return absolute
}

async function project(source: string): Promise<NativeApiProject> {
  const tsconfig = await write(
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022"],
        types: [],
        strict: true,
        noEmit: true,
        removeComments: true,
        rootDir: "./src",
        outDir: "./output",
      },
      include: ["src/**/*"],
    })
  )
  const entry = await write("src/index.ts", source)
  const session = new NativeApiProject({ tsconfig, entryPoints: [entry] })
  sessions.push(session)
  return session
}

describe("native compiler API documentation", () => {
  it("extracts a virtual declaration graph without declaration files on disk", async () => {
    const entry = path.join(temporary, "virtual/index.d.ts")
    const base = path.join(temporary, "virtual/base.d.ts")
    const files = new Map([
      [entry, 'export { Options } from "./base.js";'],
      [base, "/** Read options. */ export interface Options { /** Label. */ label: string; }"],
    ])
    const result = await extractDeclarations([entry], { declarationFiles: files })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      name: "Options",
      comment: { description: "Read options." },
      properties: [{ name: "label", type: "string" }],
    })
    await expect(fs.access(path.join(temporary, "virtual"))).rejects.toMatchObject({
      code: "ENOENT",
    })
  })

  it("retains inferred types, imported generic documentation, and compiler library bases in memory", async () => {
    const session = await project(
      'import type { Base } from "./base.js"; export interface Options extends Base<number> {} /** Create options. */ export function create() { return { value: 1 }; } export class Failure extends Error {}'
    )
    await write(
      "src/base.ts",
      "/** Base options. */\nexport interface Base<T> {\n  /** Stored value. */\n  value: T;\n}"
    )
    const configBefore = await fs.readFile(path.join(temporary, "tsconfig.json"), "utf8")
    const result = await session.generate(path.join(temporary, "routes"))
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.find((item) => item.name === "create")?.signatures[0].returnType).toContain(
      "value: number"
    )
    expect(result.items.find((item) => item.name === "Options")?.properties).toMatchObject([
      { name: "value", type: "number", comment: { description: "Stored value." } },
    ])
    expect(
      result.items.find((item) => item.name === "Failure")?.properties.map((item) => item.name)
    ).toStrictEqual(expect.arrayContaining(["name", "message", "stack", "cause"]))
    expect(result.watchFiles).toStrictEqual(
      expect.arrayContaining([
        path.join(temporary, "src/base.ts"),
        path.join(temporary, "tsconfig.json"),
      ])
    )
    expect(await fs.readFile(path.join(temporary, "tsconfig.json"), "utf8")).toBe(configBefore)
    await expect(fs.access(path.join(temporary, "output"))).rejects.toMatchObject({
      code: "ENOENT",
    })
  })

  it("updates dependency types and JSDoc, preserves pages on errors, recovers, and removes obsolete pages", async () => {
    const session = await project(
      'import { value } from "./value.js"; export { value } from "./value.js"; export function read() { return { value }; }'
    )
    const value = await write("src/value.ts", "/** Initial value. */ export const value = 1;")
    const routes = path.join(temporary, "routes")
    await session.generate(routes)
    await fs.writeFile(value, '/** Updated value. */ export const value = "guest";')
    let result = await session.generate(routes, { changed: [value] })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.find((item) => item.name === "read")?.signatures[0].returnType).toContain(
      "value: string"
    )
    expect(result.items.find((item) => item.name === "value")?.comment.description).toBe(
      "Updated value."
    )
    const page = path.join(routes, "api-reference/functions/read.md")
    const successfulPage = await fs.readFile(page, "utf8")
    await fs.writeFile(value, 'export const value: number = "wrong";')
    await expect(session.generate(routes, { changed: [value] })).rejects.toBeInstanceOf(
      NativeCompilerError
    )
    expect(await fs.readFile(page, "utf8")).toBe(successfulPage)
    await fs.writeFile(value, "export const value = true;")
    result = await session.generate(routes, { changed: [value] })
    expect(result.items.find((item) => item.name === "read")?.signatures[0].returnType).toContain(
      "value: boolean"
    )
    const entry = await write(
      "src/index.ts",
      '/** Remaining export. */ export const label = "retained";'
    )
    await fs.rm(value)
    result = await session.generate(routes, { changed: [entry], deleted: [value] })
    expect(result.items.map((item) => item.name)).toStrictEqual(["label"])
    await expect(fs.access(page)).rejects.toMatchObject({ code: "ENOENT" })
    await session.close()
    await session.close()
    await expect(session.extract()).rejects.toThrow("closed")
  })

  it("uses the compiler's tsconfig paths and conditional package resolution", async () => {
    const session = await project(
      'import type { Base } from "@local/base"; import type { External } from "conditional"; export interface Options extends Base<string>, External {}'
    )
    const config = path.join(temporary, "tsconfig.json")
    const json = JSON.parse(await fs.readFile(config, "utf8"))
    json.compilerOptions.paths = { "@local/*": ["./src/*"] }
    json.compilerOptions.customConditions = ["documentation"]
    await fs.writeFile(config, JSON.stringify(json))
    await write("src/base.ts", "export interface Base<T> { value: T; }")
    await write(
      "node_modules/conditional/package.json",
      JSON.stringify({
        name: "conditional",
        exports: { ".": { documentation: "./docs.d.ts", types: "./fallback.d.ts" } },
      })
    )
    await write(
      "node_modules/conditional/docs.d.ts",
      "export interface External { /** Selected condition. */ selected: boolean; }"
    )
    await write(
      "node_modules/conditional/fallback.d.ts",
      "export interface External { wrong: number; }"
    )
    const result = await session.extract()
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([
      { name: "value", type: "string" },
      { name: "selected", type: "boolean", comment: { description: "Selected condition." } },
    ])
  })

  it("tracks extended configs and refreshes include globs after adding a source file", async () => {
    const session = await project('export * from "./added.js";')
    const config = path.join(temporary, "tsconfig.json")
    const json = JSON.parse(await fs.readFile(config, "utf8"))
    const base = await write("base.json", JSON.stringify({ compilerOptions: { strict: true } }))
    json.extends = "./base.json"
    await fs.writeFile(config, JSON.stringify(json))
    await expect(session.extract()).rejects.toBeInstanceOf(NativeCompilerError)
    const added = await write("src/added.ts", "export const added = 1;")
    const result = await session.extract({ created: [added] })
    expect(result.items.map((item) => item.name)).toStrictEqual(["added"])
    expect(result.watchFiles).toContain(base)
  })

  it("selects NodeNext import and require declarations when package format changes", async () => {
    const session = await project(
      'import type { Base } from "dual"; export interface Options extends Base {}'
    )
    const config = path.join(temporary, "tsconfig.json")
    const json = JSON.parse(await fs.readFile(config, "utf8"))
    json.compilerOptions.module = "NodeNext"
    json.compilerOptions.moduleResolution = "NodeNext"
    await fs.writeFile(config, JSON.stringify(json))
    await write(
      "node_modules/dual/package.json",
      JSON.stringify({
        name: "dual",
        exports: {
          ".": { import: { types: "./import.d.mts" }, require: { types: "./require.d.cts" } },
        },
      })
    )
    await write("node_modules/dual/import.d.mts", "export interface Base { imported: string; }")
    await write("node_modules/dual/require.d.cts", "export interface Base { required: number; }")
    const initial = await session.extract()
    expect(initial.items[0].properties).toMatchObject([{ name: "required", type: "number" }])
    const manifest = await write("package.json", JSON.stringify({ type: "module" }))
    const result = await session.extract({ created: [manifest], invalidateAll: true })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([{ name: "imported", type: "string" }])
  })

  it("uses explicit resolution-mode attributes instead of the file's package format", async () => {
    const session = await project(
      'import type { Base } from "dual" with { "resolution-mode": "require" }; export interface Options extends Base {}'
    )
    const config = path.join(temporary, "tsconfig.json")
    const json = JSON.parse(await fs.readFile(config, "utf8"))
    json.compilerOptions.module = "NodeNext"
    json.compilerOptions.moduleResolution = "NodeNext"
    await fs.writeFile(config, JSON.stringify(json))
    await write("package.json", JSON.stringify({ type: "module" }))
    await write(
      "node_modules/dual/package.json",
      JSON.stringify({
        name: "dual",
        exports: {
          ".": { import: { types: "./import.d.mts" }, require: { types: "./require.d.cts" } },
        },
      })
    )
    await write("node_modules/dual/import.d.mts", "export interface Base { wrong: string; }")
    await write("node_modules/dual/require.d.cts", "export interface Base { selected: number; }")
    const result = await session.extract()
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([{ name: "selected", type: "number" }])
  })

  it("reports ambiguous mixed import modes instead of expanding the wrong base", async () => {
    const session = await project(
      'import type { Base as Imported } from "dual" with { "resolution-mode": "import" }; import type { Base as Required } from "dual" with { "resolution-mode": "require" }; export interface Options extends Imported, Required {}'
    )
    const config = path.join(temporary, "tsconfig.json")
    const json = JSON.parse(await fs.readFile(config, "utf8"))
    json.compilerOptions.module = "NodeNext"
    json.compilerOptions.moduleResolution = "NodeNext"
    await fs.writeFile(config, JSON.stringify(json))
    await write("package.json", JSON.stringify({ type: "module" }))
    await write(
      "node_modules/dual/package.json",
      JSON.stringify({
        name: "dual",
        exports: {
          ".": { import: { types: "./import.d.mts" }, require: { types: "./require.d.cts" } },
        },
      })
    )
    await write("node_modules/dual/import.d.mts", "export interface Base { imported: string; }")
    await write("node_modules/dual/require.d.cts", "export interface Base { required: number; }")
    const result = await session.extract()
    expect(result.items[0].propertiesComplete).toBe(false)
    expect(result.items[0].properties).toStrictEqual([])
    expect(result.diagnostics).toHaveLength(2)
  })

  it("fails a one-shot build on missing input and keeps handwritten output protected", async () => {
    await expect(
      generateNativeDocs(
        {
          tsconfig: path.join(temporary, "missing.json"),
          entryPoints: [path.join(temporary, "src/index.ts")],
        },
        temporary
      )
    ).rejects.toBeInstanceOf(NativeCompilerError)
    const session = await project("export const value = 1;")
    await write("routes/api-reference/notes.md", "Handwritten")
    await expect(session.generate(path.join(temporary, "routes"))).rejects.toThrow(
      "Refusing to delete"
    )
    expect(await fs.readFile(path.join(temporary, "routes/api-reference/notes.md"), "utf8")).toBe(
      "Handwritten"
    )
  })
})
