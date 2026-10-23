import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { extractDeclarations, generateDeclarationDocs } from "./index"

let temporary: string
beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-declarations-"))
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

describe("declaration API documentation", () => {
  it("renders components as JSX with linked props and import paths from named entry points", async () => {
    const ui = await declaration(
      "ui.d.ts",
      [
        "export type CardProps = {",
        "  /** Card heading. */",
        "  title: string;",
        "  link?: {",
        "    href: string;",
        "    label?: string;",
        "  };",
        '  children?: import("react").ReactNode;',
        "};",
        "/** A card. */",
        'export declare function Card({ title: heading, link, children }: CardProps): import("react").JSX.Element;',
        'export declare function Head(): import("react").JSX.Element | null;',
      ].join("\n")
    )
    const runtime = await declaration(
      "runtime.d.ts",
      [
        "import type { CardProps } from './ui';",
        "export { Card } from './ui';",
        "/** Read the card. */",
        "export declare function useCard({ title }: CardProps): CardProps;",
      ].join("\n")
    )
    const result = await generateDeclarationDocs(
      { entryPoints: [ui, runtime], importPaths: ["my-lib/ui", "my-lib/runtime"] },
      temporary
    )
    const page = (file: string) => result.pages.find((item) => item.path === file)?.content ?? ""

    const card = page("components/card.md")
    expect(card).toContain(
      '```tsx\nimport { Card } from "my-lib/ui"\n\n<Card title={…}>{children}</Card>\n```'
    )
    expect(card).toContain("## Props")
    expect(card).toContain("| ` link ` | ` { href: string; label?: string } ` | No |")
    expect(card).toContain("Props type: ` CardProps `")
    expect(card).not.toContain("## Parameters")
    expect(card).not.toContain("## Returns")
    expect(card).not.toContain("import(")

    expect(page("components/head.md")).toContain("<Head />")
    expect(page("components/head.md")).toContain("This component takes no props.")

    const hook = page("functions/usecard.md")
    expect(hook).toContain(
      '```ts\nimport { useCard } from "my-lib/runtime"\n\nuseCard(props: CardProps): CardProps\n```'
    )
    // CardProps adds nothing beyond the props of Card, so it has no page of its own.
    expect(hook).toContain(
      "| ` props ` | [` CardProps `](/api-reference/components/card#props) | Yes |"
    )
    expect(page("types/cardprops.md")).toBe("")

    // The first entry point that exports a declaration owns it.
    expect(result.items.find((item) => item.name === "Card")?.importPath).toBe("my-lib/ui")
    expect(page("index.md")).toContain("## `my-lib/ui`\n\n### Components")
    expect(page("index.md")).not.toContain("CardProps")
    expect(page("index.md")).toContain("## `my-lib/runtime`\n\n### Functions")
  })

  it("locates preceding JSDoc among unrelated and nested comments without borrowing later documentation", async () => {
    const entry = await declaration(
      "api.d.ts",
      [
        "export interface First { value: string; }",
        ...Array.from(
          { length: 100 },
          (_, index) =>
            `/** Helper ${index}. */ interface Helper${index} { /** Helper field. */ value: number; }`
        ),
        "/** Selected options. */",
        "// Keep this declaration compatible with the previous release.",
        "export interface Selected { /** Documented field. */ value: string; }",
        "export interface Last { /** Only the field is documented. */ value: boolean; }",
        "/** A trailing comment does not document a previous declaration. */",
      ].join("\r\n")
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.comment.description)).toStrictEqual([
      "",
      "Selected options.",
      "",
    ])
    expect(result.items.map((item) => item.properties[0].comment.description)).toStrictEqual([
      "",
      "Documented field.",
      "Only the field is documented.",
    ])
  })

  it("retains JSDoc across lint comments without attaching documentation from a previous declaration", async () => {
    const entry = await declaration(
      "api.d.ts",
      [
        "/** Documented options. */",
        "// oxlint-disable-next-line typescript/consistent-type-definitions",
        "export interface Options { label: string; }",
        "/** Render a document. */",
        "// The arguments are the stable API shape.",
        "/* eslint-disable-next-line max-params */",
        "export declare function render(value: string): string;",
        "// No documentation for this declaration.",
        "export declare function other(): void;",
        "/** @internal */",
        "// eslint-disable-next-line max-params",
        "export declare function internalOnly(): void;",
      ].join("\n")
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.items.find((item) => item.name === "Options")?.comment.description).toBe(
      "Documented options."
    )
    expect(result.pages.find((page) => page.path === "functions/render.md")?.content).toContain(
      "Render a document."
    )
    expect(result.items.find((item) => item.name === "other")?.comment.description).toBe("")
    expect(result.items.map((item) => item.name)).toStrictEqual(["Options", "render", "other"])
  })

  it("renders emitted types, JSDoc, parameters, examples, and overloads", async () => {
    const entry = await declaration(
      "api.d.ts",
      [
        "/** Public options. */",
        "export interface Options {",
        "  /** Display name. */ label: string;",
        "  /** Optional size. @defaultValue 2 */ size?: number;",
        "}",
        "/** Trims text. See {@link Options}.",
        " * @param value - Text to trim.",
        " * @returns Trimmed text.",
        " * @example",
        " * ```ts",
        " * normalize(' hello ')",
        " * ```",
        " */",
        "export declare function normalize(value: string): string;",
        "export declare function createUser(name?: string): { name: string; id: number };",
        "export declare function choose(value: string): string;",
        "export declare function choose(value: number): number;",
        "/** @internal */ export declare function internalOnly(): number;",
      ].join("\n")
    )
    const result = await generateDeclarationDocs(
      { entryPoints: [entry], title: "API: Example" },
      temporary
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual([
      "Options",
      "normalize",
      "createUser",
      "choose",
    ])
    const normalize = await fs.readFile(
      path.join(temporary, "api-reference/functions/normalize.md"),
      "utf8"
    )
    expect(normalize).toContain("normalize(value: string): string")
    expect(normalize).toContain("Text to trim.")
    expect(normalize).toContain("Trimmed text.")
    expect(normalize).toContain("[Options](/api-reference/interfaces/options)")
    expect(normalize).toContain("normalize(' hello ')")
    expect(result.pages.find((page) => page.path === "interfaces/options.md")?.content).toContain(
      "Default:"
    )
    expect(
      result.items.find((item) => item.name === "Options")?.properties[1].comment.tags
    ).toContainEqual({ name: "defaultValue", text: "2" })
    expect(
      result.items.find((item) => item.name === "choose")?.signatures.map((item) => item.returnType)
    ).toStrictEqual(["string", "number"])
    expect(result.items.find((item) => item.name === "Options")?.properties[1]).toMatchObject({
      name: "size",
      type: "number",
      optional: true,
    })
    const index = await fs.readFile(path.join(temporary, "api-reference/index.md"), "utf8")
    expect(index).toContain('title: "API: Example"')
    expect(
      await fs.readFile(path.join(temporary, "api-reference/.ardo-generated"), "utf8")
    ).toContain("Generated by Ardo")
  })

  it("follows renamed, type-only, and wildcard exports, including a cyclic barrel", async () => {
    await declaration(
      "api.d.ts",
      "export declare function normalize(value: string): string; export interface Options { label: string }"
    )
    await declaration("barrel.d.ts", 'export * from "./index.js"; export * from "./api.js";')
    const entry = await declaration(
      "index.d.ts",
      'export { normalize as clean } from "./api.js"; export type { Options } from "./api.js"; export * from "./barrel.js";'
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.name)).toStrictEqual(["clean", "Options", "normalize"])
    expect(result.items[0].signatures[0].text).toBe("clean(value: string): string")
  })

  it("expands documented inherited properties, generic arguments, and common utility types", async () => {
    await declaration(
      "types.d.ts",
      [
        "export interface Base<T> { /** The stored value. */ value: T; /** Optional label. */ label?: string; }",
        "export interface Props extends Pick<Base<number>, 'value'> { /** Click handler. */ onClick?: (value: number) => void; }",
      ].join("\n")
    )
    const entry = await declaration(
      "index.d.ts",
      [
        "import type { Base, Props } from './types.js';",
        "export type Options = Readonly<Partial<Base<string>>> & { active: boolean };",
        "export declare function Button(props: Props): unknown;",
        "export declare class Parent<T> { /** Stored value. */ value: T; private hidden; protected secret: string; }",
        "export declare class Child extends Parent<string> { read(): string; }",
      ].join("\n")
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    const options = result.items.find((item) => item.name === "Options")
    expect(options?.properties).toMatchObject([
      {
        name: "value",
        type: "string",
        optional: true,
        readonly: true,
        comment: { description: "The stored value." },
      },
      { name: "label", type: "string", optional: true, readonly: true },
      { name: "active", type: "boolean", optional: false },
    ])
    expect(result.items.find((item) => item.name === "Button")).toMatchObject({
      kind: "component",
      propertiesComplete: true,
      properties: [
        { name: "value", type: "number", comment: { description: "The stored value." } },
        { name: "onClick", optional: true },
      ],
    })
    expect(result.items.find((item) => item.name === "Child")?.properties).toMatchObject([
      { name: "value", type: "string" },
      { name: "read", kind: "method" },
    ])
  })

  it("preserves unions and reports unsupported expansion rather than merging alternative shapes", async () => {
    const entry = await declaration(
      "api.d.ts",
      "export type Props = { kind: 'a'; value: string } | { kind: 'b'; value: number }; export declare function Button(props: Props): unknown;"
    )
    const result = await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    expect(result.items.find((item) => item.name === "Button")).toMatchObject({
      properties: [],
      propertiesComplete: false,
    })
    expect(result.diagnostics[0].message).toContain("Property expansion is not supported")
    expect(result.pages.find((page) => page.path === "types/props.md")?.content).toContain(
      "kind: 'b'; value: number"
    )
    expect(result.pages.find((page) => page.path === "components/button.md")?.content).toContain(
      "Additional members"
    )
  })

  it("handles function aliases and ReturnType from emitted function declarations", async () => {
    const entry = await declaration(
      "api.d.ts",
      "export declare function createUser(): { name: string; id: number }; export declare const createAgain: typeof createUser; export type Result = ReturnType<typeof createUser>;"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.find((item) => item.name === "createAgain")?.signatures[0].returnType).toBe(
      "{ name: string; id: number }"
    )
    expect(
      result.items
        .find((item) => item.name === "Result")
        ?.properties.map((property) => property.name)
    ).toStrictEqual(["name", "id"])
  })

  it("keeps Unicode comment positions and leaves shadowed generic callback types intact", async () => {
    const entry = await declaration(
      "api.d.ts",
      "/** Café 😀. */ interface Base<T> { value: T; callback: <T>(value: T) => T; literal: 'T'; } export interface Options extends Base<string> {} export interface Numeric extends Base<number> {}"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics).toStrictEqual([])
    expect(
      result.items.map((item) => item.properties.map((property) => property.type))
    ).toStrictEqual([
      ["string", "<T>(value: T) => T", "'T'"],
      ["number", "<T>(value: T) => T", "'T'"],
    ])
  })

  it("preserves precedence when substituting compound generic arguments", async () => {
    const entry = await declaration(
      "api.d.ts",
      "interface Base<T> { values: T[] } export interface Options extends Base<string | number> {}"
    )
    const result = await extractDeclarations([entry])
    expect(result.items[0].properties[0].type).toBe("(string | number)[]")
  })

  it("keeps unresolved external exports and types visible as diagnostics", async () => {
    const entry = await declaration(
      "api.d.ts",
      "export * from 'external-package'; import type { ExternalProps } from 'external-package'; export interface Props extends ExternalProps { own: string }"
    )
    const result = await extractDeclarations([entry])
    expect(result.diagnostics.map((diagnostic) => diagnostic.message)).toStrictEqual(
      expect.arrayContaining([
        expect.stringContaining("Could not expand export *"),
        expect.stringContaining("ExternalProps"),
      ])
    )
    expect(result.items[0]).toMatchObject({
      propertiesComplete: false,
      properties: [{ name: "own", type: "string" }],
    })
  })

  it("protects handwritten routes and restricts the output directory", async () => {
    const entry = await declaration("api.d.ts", "export interface Options { label: string }")
    await declaration("api-reference/overview.md", "# Handwritten content")
    await expect(generateDeclarationDocs({ entryPoints: [entry] }, temporary)).rejects.toThrow(
      "Refusing to delete"
    )
    expect(await fs.readFile(path.join(temporary, "api-reference/overview.md"), "utf8")).toBe(
      "# Handwritten content"
    )
    await expect(
      generateDeclarationDocs({ entryPoints: [entry], out: "../api" }, temporary)
    ).rejects.toThrow("api.out must resolve inside")
  })

  it("rejects source files and parse failures before replacing existing generated pages", async () => {
    const entry = await declaration("api.d.ts", "export interface Options { label: string }")
    await generateDeclarationDocs({ entryPoints: [entry] }, temporary)
    await fs.writeFile(entry, "export interface Options {")
    await expect(generateDeclarationDocs({ entryPoints: [entry] }, temporary)).rejects.toThrow(
      "Could not parse"
    )
    expect(
      await fs.readFile(path.join(temporary, "api-reference/interfaces/options.md"), "utf8")
    ).toContain("label")
    await expect(extractDeclarations([entry.replace(".d.ts", ".ts")])).rejects.toThrow(
      "Expected a declaration entry point"
    )
  })
})
