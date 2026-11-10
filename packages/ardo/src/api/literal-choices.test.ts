import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-literal-choices-"))
})
afterEach(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

describe("const-tuple indexed alias documentation", () => {
  it("shows every choice for local and re-exported aliases without exposing private tuples", async () => {
    const entry = path.join(temporary, "index.d.ts")
    await fs.writeFile(
      entry,
      `declare const CONFIG_LEVELS: readonly ["essential", "recommended", "strict"];
export type ConfigLevel = (typeof CONFIG_LEVELS)[number];
export { ScopedConfig } from "./scoped.js";`
    )
    await fs.writeFile(
      path.join(temporary, "scoped.d.ts"),
      `declare const SCOPED_CONFIGS: readonly ["react", "node", "vitest", "jest", "scripts", "config", "declarations"];
export type ScopedConfig = (typeof SCOPED_CONFIGS)[number];`
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual(["ConfigLevel", "ScopedConfig"])
    const page = (name: string) =>
      result.pages.find((item) => item.path === `types/${name}.md`)?.content
    for (const [name, values, expression] of [
      ["configlevel", ["essential", "recommended", "strict"], "CONFIG_LEVELS"],
      [
        "scopedconfig",
        ["react", "node", "vitest", "jest", "scripts", "config", "declarations"],
        "SCOPED_CONFIGS",
      ],
    ] as const) {
      const markdown = page(name)
      expect(markdown).toContain(`(typeof ${expression})[number]`)
      expect(markdown).toContain("## Values")
      for (const value of values) expect(markdown).toContain(JSON.stringify(value))
      expect(markdown).not.toContain("## Properties")
      expect(markdown).not.toContain("Additional members")
      expect(result.pages.find((item) => item.path === "index.md")?.content).toContain(
        `/api-reference/types/${name}`
      )
    }
  })

  it("documents the numeric index of an empty readonly tuple as never", async () => {
    const entry = path.join(temporary, "empty.d.ts")
    await fs.writeFile(
      entry,
      "declare const EMPTY: readonly []; export type Empty = (typeof EMPTY)[number];"
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].literalChoices).toStrictEqual([])
    expect(result.pages.find((page) => page.path === "types/empty.md")?.content).toContain(
      "## Values\n\n```ts\nnever\n```"
    )
  })

  it("preserves expressions and diagnostics for unsupported or unresolved indexes", async () => {
    const entry = path.join(temporary, "unsupported.d.ts")
    await fs.writeFile(
      entry,
      `declare const ARRAY: readonly string[];
declare const OPEN: readonly ["known", ...string[]];
declare const OPTIONAL: readonly ["known", "maybe"?];
declare const TUPLE: readonly ["first", "second"];
export type ArrayValue = (typeof ARRAY)[number];
export type OpenValue = (typeof OPEN)[number];
export type OptionalValue = (typeof OPTIONAL)[number];
export type First = (typeof TUPLE)[0];
export type Missing = (typeof UNKNOWN)[number];`
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.diagnostics).toHaveLength(5)
    expect(
      result.diagnostics.every((item) => item.message.includes("expression is preserved"))
    ).toBe(true)
    for (const item of result.items) {
      expect(item.propertiesComplete).toBe(false)
      const page = result.pages.find((candidate) => candidate.content.includes(`# ${item.name}\n`))
      expect(page?.content).toContain(item.signature)
      expect(page?.content).not.toContain("## Values")
    }
  })
})
