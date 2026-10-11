import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractDeclarations, generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-package-bases-"))
})
afterEach(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

async function write(file: string, source: string): Promise<string> {
  const absolute = path.join(temporary, file)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, source)
  return absolute
}

async function install(
  location: { name: string; directory: string } | string,
  manifest: Record<string, unknown>,
  files: Record<string, string>
): Promise<void> {
  const { name, directory } =
    typeof location === "string" ? { name: location, directory: "node_modules" } : location
  const root = path.join(directory, name)
  await write(path.join(root, "package.json"), JSON.stringify({ name, ...manifest }))
  for (const [file, source] of Object.entries(files)) await write(path.join(root, file), source)
}

describe("package declaration bases", () => {
  it("expands imported generic bases and preserves inherited docs without loading runtime code", async () => {
    await install(
      "base-package",
      { exports: { ".": { types: "./types.d.mts", default: "./runtime.mjs" } } },
      {
        "types.d.mts":
          "export interface Base<T = string> { /** Stored value. */ readonly value: T; /** Display label. */ label?: string }",
        "runtime.mjs": "throw new Error('Runtime code must not be loaded');",
      }
    )
    // A leaf property needs its type text, not the dependency's entire graph.
    await install("unused-package", { types: "./broken.d.ts" }, { "broken.d.ts": "invalid {{{" })
    const entry = await write(
      "api.d.ts",
      "import type { Base as Parent } from 'base-package'; import type { Leaf } from 'unused-package'; export interface Options extends Partial<Parent<number>> { /** Own label. */ label: string; leaf: Leaf } export interface Defaults extends Parent {}"
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual(["Options", "Defaults"])
    expect(result.items[0]).toMatchObject({
      propertiesComplete: true,
      properties: [
        {
          name: "value",
          type: "number",
          optional: true,
          readonly: true,
          comment: { description: "Stored value." },
        },
        { name: "label", optional: false, comment: { description: "Own label." } },
        { name: "leaf", type: "Leaf" },
      ],
    })
    expect(result.items[1].properties[0].type).toBe("string")
    expect(result.files.some((file) => file.includes("unused-package"))).toBe(false)
    expect(result.pages.find((page) => page.path === "interfaces/options.md")?.content).toContain(
      "Stored value."
    )
  })

  it.each([
    ["d.mts", "import", "string"],
    ["d.cts", "require", "number"],
  ])("uses the %s declaration's %s export condition", async (extension, _mode, type) => {
    await install(
      "dual-package",
      {
        exports: {
          ".": {
            import: { types: "./esm.d.mts", default: "./esm.mjs" },
            require: { types: "./cjs.d.cts", default: "./cjs.cjs" },
          },
        },
      },
      {
        "esm.d.mts": "export interface Base { value: string }",
        "cjs.d.cts": "export interface Base { value: number }",
      }
    )
    const entry = await write(
      `api.${extension}`,
      "import type { Base } from 'dual-package'; export interface Options extends Base {}"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties[0].type).toBe(type)
  })

  it("resolves scoped subpaths and patterns while respecting blocked and private exports", async () => {
    await install(
      "@scope/base",
      {
        exports: {
          "./types/*": { types: "./declarations/*.d.mts" },
          "./types/private": null,
        },
      },
      {
        "declarations/public.d.mts":
          "interface Hidden { leaked: boolean } export interface Base<T> { value: T }",
        "declarations/private.d.mts": "export interface Base { leaked: boolean }",
      }
    )
    const entry = await write(
      "api.d.mts",
      [
        "import type * as Public from '@scope/base/types/public';",
        "import type { Base as Blocked } from '@scope/base/types/private';",
        "import type { Hidden } from '@scope/base/types/public';",
        "export interface Options extends Public.Base<string> {}",
        "export interface Private extends Blocked { own: string }",
        "export interface Unexported extends Hidden {}",
      ].join("\n")
    )
    const result = await extractDeclarations([entry])
    expect(result.items[0]).toMatchObject({
      propertiesComplete: true,
      properties: [{ name: "value", type: "string" }],
    })
    expect(result.items[1]).toMatchObject({
      propertiesComplete: false,
      properties: [{ name: "own" }],
    })
    expect(result.items[2]).toMatchObject({ propertiesComplete: false, properties: [] })
    expect(result.diagnostics.map((item) => item.message)).toStrictEqual([
      "Could not expand properties of Blocked.",
      "Could not expand properties of Hidden.",
    ])
  })

  it.each([
    [{ types: "./types.d.ts" }, "types.d.ts"],
    [{ typings: "./types.d.ts" }, "types.d.ts"],
    [{ main: "./runtime.js" }, "runtime.d.ts"],
    [{}, "index.d.ts"],
  ])("supports legacy declaration entries %j", async (manifest, file) => {
    await install("legacy-package", manifest, {
      [file]: "export interface Base { value: boolean }",
    })
    const entry = await write(
      "api.d.ts",
      "import type { Base } from 'legacy-package'; export interface Options extends Base {}"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties[0].type).toBe("boolean")
  })

  it.each([
    { exports: { ".": { import: { types: null }, default: "./fallback.d.ts" } } },
    { types: "./fallback.d.ts", typesVersions: { ">=7": { "*": ["./versioned.d.ts"] } } },
    { exports: { ".": { "types@>=7": "./versioned.d.ts", types: "./fallback.d.ts" } } },
  ])(
    "reports blocked or version-dependent declarations without guessing a fallback: %j",
    async (manifest) => {
      await install("versioned-package", manifest, {
        "fallback.d.ts": "export interface Base { guessed: string }",
        "versioned.d.ts": "export interface Base { versioned: number }",
      })
      const entry = await write(
        "api.d.mts",
        "import type { Base } from 'versioned-package'; export interface Options extends Base { own: boolean }"
      )
      const result = await extractDeclarations([entry])
      expect(result.items[0]).toMatchObject({
        propertiesComplete: false,
        properties: [{ name: "own" }],
      })
      expect(result.diagnostics.map((item) => item.message)).toStrictEqual([
        "Could not expand properties of Base.",
      ])
    }
  )

  it("uses the package's own dependency through a symlink and a project root for out-of-tree emit", async () => {
    await install(
      { name: "base-package", directory: "project/node_modules" },
      { types: "./index.d.ts" },
      { "index.d.ts": "export interface Base { wrongVersion: true }" }
    )
    await install(
      { name: "parent-package", directory: "store" },
      { types: "./index.d.ts" },
      {
        "index.d.ts":
          "import type { Base } from 'base-package'; export interface Parent extends Base { own: boolean }",
      }
    )
    await install(
      { name: "base-package", directory: "store/parent-package/node_modules" },
      { types: "./index.d.ts" },
      { "index.d.ts": "export interface Base { correctVersion: true }" }
    )
    await fs.symlink(
      path.join(temporary, "store/parent-package"),
      path.join(temporary, "project/node_modules/parent-package"),
      "dir"
    )
    const entry = await write(
      "output/api.d.ts",
      "import type { Parent } from 'parent-package'; export interface Options extends Parent {}"
    )
    const result = await extractDeclarations([entry], {
      packageRoot: path.join(temporary, "project"),
    })
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties.map((item) => item.name)).toStrictEqual([
      "correctVersion",
      "own",
    ])
  })

  it("follows external wildcard and renamed exports with cyclic package barrels", async () => {
    await install(
      "barrel-package",
      { types: "./index.d.ts" },
      {
        "index.d.ts": "export * from './cycle.js'; export { Base as Parent } from './base.js';",
        "cycle.d.ts": "export * from './index.js';",
        "base.d.ts": "export interface Base { /** Inherited value. */ value: string }",
      }
    )
    const entry = await write("api.d.ts", "export * from 'barrel-package';")
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual(["Parent"])
    expect(result.items[0].properties[0].comment.description).toBe("Inherited value.")
  })

  it("includes all 29 Ferromark base options in Ardo's MarkdownConfig table", async () => {
    const packageRoot = fileURLToPath(new URL("../../", import.meta.url))
    const source = await fs.readFile(path.join(packageRoot, "src/config/markdown.ts"), "utf8")
    const entry = await write("markdown.d.ts", source)
    const result = await generateDeclarationDocs(
      { entryPoints: [entry], packageRoot },
      path.join(temporary, "routes")
    )
    const markdown = result.items.find((item) => item.name === "MarkdownConfig")
    expect(result.diagnostics).toStrictEqual([])
    expect(markdown?.propertiesComplete).toBe(true)
    expect(markdown?.properties).toHaveLength(33)
    expect(markdown?.properties.find((item) => item.name === "footnotes")).toMatchObject({
      type: "boolean",
      optional: true,
    })
    expect(
      markdown?.properties.find((item) => item.name === "passes")?.comment.description
    ).not.toBe("")
    expect(result.items.map((item) => item.name)).toStrictEqual(["MarkdownConfig"])
    const page = result.pages.find((item) => item.path === "types/markdownconfig.md")?.content
    expect(page).toContain("footnotes")
    expect(page).toContain("passes")
  })
})
