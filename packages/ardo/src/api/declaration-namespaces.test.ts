import path from "node:path"
import { describe, expect, it } from "vitest"

import { DeclarationReader } from "./declaration-project"
import { extractDeclarations } from "./index"
import { TypeProperties } from "./properties"

const root = "/private/tmp/ardo-declaration-namespaces"

async function extract(entry: string, sources: Record<string, string>) {
  const files = new Map(
    Object.entries({ "entry.d.ts": entry, ...sources }).map(([name, source]) => [
      path.join(root, name),
      source,
    ])
  )
  return extractDeclarations([path.join(root, "entry.d.ts")], {
    declarationFiles: files,
    resolveImport: async (_, request) => path.join(root, `${request.replace(/^\.\//u, "")}.d.ts`),
  })
}

describe("declaration namespace resolution", () => {
  it("expands export-assignment members through named, default, namespace, and require aliases", async () => {
    const result = await extract(
      `
      import type { Attributes } from "./library";
      import type Default from "./library";
      import type * as Star from "./library";
      import Required = require("./library");
      export interface Named extends Omit<Attributes<number>, "omit"> {}
      export interface Defaulted extends Default.Attributes<string> {}
      export interface Namespaced extends Star.Attributes<boolean> {}
      export interface RequiredAlias extends Required.Attributes<bigint> {}
    `,
      {
        "library.d.ts": `
        interface PrivateOuter<T> { outer: T; }
        export = Library;
        export as namespace BrowserLibrary;
        declare namespace Library {
          interface Base<T> extends PrivateOuter<T> { value: T; omit: string; }
          interface Attributes<T> extends Base<T> { /** Own option. */ own?: T; }
        }
        declare namespace Library { interface Attributes<T> { merged: T[]; } }
      `,
      }
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.propertiesComplete)).toStrictEqual([
      true,
      true,
      true,
      true,
    ])
    expect(result.items[0].properties).toMatchObject([
      { name: "outer", type: "number" },
      { name: "value", type: "number" },
      { name: "own", type: "number", optional: true, comment: { description: "Own option." } },
      { name: "merged", type: "number[]" },
    ])
    expect(result.items[1].properties[0].type).toBe("string")
    expect(result.items[2].properties[0].type).toBe("boolean")
    expect(result.items[3].properties[0].type).toBe("bigint")
  })

  it("resolves nested declarations, namespace re-exports, and public import-equals aliases", async () => {
    const result = await extract(
      `
      import type { Surface } from "./bridge";
      import type * as Bridge from "./bridge";
      export interface Renamed extends Surface.PublicAlias.Options<number> {}
      export interface Deep extends Bridge.Whole.Outer.Inner.Options<boolean> {}
      export interface MergedAlias extends Surface.FromOtherBlock {}
    `,
      {
        "bridge.d.ts":
          'export { Outer as Surface } from "./library"; export * as Whole from "./library";',
        "library.d.ts": `
        export namespace Outer {
          namespace Inner { interface Options<T = string> { value: T; } }
          export import PublicAlias = Inner;
        }
        export namespace Outer { interface FromOtherBlock extends PublicAlias.Options {} }
      `,
      }
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.properties[0].type)).toStrictEqual([
      "number",
      "boolean",
      "string",
    ])
  })

  it("resolves qualified export assignments and dotted namespace declarations", async () => {
    const result = await extract(
      `
      import Nested = require("./library");
      export interface Public extends Nested.Options<number> {}
    `,
      {
        "library.d.ts": `declare namespace Root.Inner { interface Options<T> { value: T; } } export = Root.Inner;`,
      }
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties).toMatchObject([{ name: "value", type: "number" }])
  })

  it("preserves private helpers, generic defaults, and same-name collisions in merged blocks", async () => {
    const result = await extract(
      `
      import type { First, Second, Third, Box, Item } from "./library";
      export interface One extends First {}
      export interface Two extends Second {}
      export interface Three extends Third {}
      export interface PrivateItem extends Box {}
      export interface PublicItem extends Item {}
    `,
      {
        "library.d.ts": `
        declare namespace N {
          interface Helper { kind: "one"; }
          type Hidden<T = Helper> = T;
          export { Hidden as First };
        }
        declare namespace N {
          interface Helper { kind: "two"; }
          type Hidden<T = Helper> = T;
          export { Hidden as Second };
        }
        declare namespace N {
          interface Item { kind: "private"; }
          interface Box extends Item {}
          export { Box };
        }
        declare namespace N { interface Item { kind: "public"; } interface Third { third: true; } }
        export = N;
      `,
      }
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.properties[0].type)).toStrictEqual([
      '"one"',
      '"two"',
      "true",
      '"private"',
      '"public"',
    ])
  })

  it("keeps private import aliases and explicit export-list locals out of public namespace lookup", async () => {
    const result = await extract(
      `
      import type * as N from "./library";
      export interface Good extends N.Exposed.Options {}
      export interface PrivateAlias extends N.PrivateAlias.Options {}
      export interface PrivateName extends N.Hidden {}
      export interface PrivateNested extends N.Nested.Options {}
      export interface NoGlobal extends BrowserN.Exposed.Options {}
      export interface NoAliasLeak extends N.OtherBlock {}
    `,
      {
        "library.d.ts": `
        declare namespace N {
          namespace Internal { interface Options { visible: true; } }
          import PrivateAlias = Internal;
          export import Exposed = Internal;
        }
        declare namespace N {
          interface Hidden { hidden: true; }
          namespace Nested { interface Options { hidden: true; } }
          export { Hidden as Renamed };
        }
        declare namespace N { interface OtherBlock extends Renamed {} }
        export = N;
        export as namespace BrowserN;
      `,
      }
    )
    expect(result.items[0].propertiesComplete).toBe(true)
    expect(result.items[0].properties).toMatchObject([{ name: "visible", type: "true" }])
    expect(result.items.slice(1).map((item) => item.propertiesComplete)).toStrictEqual([
      false,
      false,
      false,
      false,
      false,
    ])
    expect(result.items.slice(1).map((item) => item.properties)).toStrictEqual([[], [], [], [], []])
    expect(result.diagnostics).toHaveLength(5)
  })

  it("preserves lexical parents and distinct namespace identities during recursive expansion", async () => {
    const result = await extract(
      `
      interface Parent { parent: true; }
      declare namespace A {
        interface Base extends Parent { a: true; }
        namespace B { interface Base extends A.Base { b: true; } }
      }
      export interface Public extends A.B.Base {}
    `,
      {}
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0].properties.map((item) => item.name)).toStrictEqual(["parent", "a", "b"])
  })

  it("retains the current lexical parent in every merged nested namespace block", async () => {
    const result = await extract(
      `
      declare namespace Outer {
        interface Helper { first: true; }
        export namespace Inner { interface First extends Helper {} }
        export {};
      }
      declare namespace Outer {
        interface Helper { second: true; }
        export namespace Inner { interface Second extends Helper {} }
        export {};
      }
      export interface First extends Outer.Inner.First {}
      export interface Second extends Outer.Inner.Second {}
    `,
      {}
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.propertiesComplete)).toStrictEqual([true, true])
    expect(
      result.items.map((item) => item.properties.map((property) => property.name))
    ).toStrictEqual([["first"], ["second"]])
  })

  it("retains per-declaration lexical parents through merged dotted namespace paths", async () => {
    const result = await extract(
      `
      declare namespace Outer {
        interface Helper { first: true; }
        export namespace Inner.Deep { interface First extends Helper {} }
        export {};
      }
      declare namespace Outer {
        interface Helper { second: true; }
        export namespace Inner.Deep { interface Second extends Helper {} }
        export {};
      }
      export interface First extends Outer.Inner.Deep.First {}
      export interface Second extends Outer.Inner.Deep.Second {}
    `,
      {}
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items.map((item) => item.propertiesComplete)).toStrictEqual([true, true])
    expect(
      result.items.map((item) => item.properties.map((property) => property.name))
    ).toStrictEqual([["first"], ["second"]])
  })

  it("expands literal utility keys in the alias declaration's private lexical scope", async () => {
    const result = await extract(
      `
      declare namespace N {
        interface Attrs { a: string; b: number; }
        type PrivateKeys = "a";
        export type Keys = PrivateKeys;
        export interface Public extends Omit<Attrs, Keys> {}
        export {};
      }
      export interface Public extends N.Public {}
    `,
      {}
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(result.items[0]).toMatchObject({
      propertiesComplete: true,
      properties: [{ name: "b", type: "number" }],
    })
  })

  it("expands named-import and namespace-qualified utility keys through private aliases", async () => {
    const result = await extract(
      `
      import type { Attrs, Keys } from "./library";
      import type * as N from "./library";
      export interface Named extends Omit<Attrs, Keys> {}
      export interface Qualified extends Omit<N.Attrs, N.Keys> {}
    `,
      {
        "library.d.ts": `
        declare namespace Library {
          type PrivateKeys = "a";
          export type Keys = PrivateKeys;
          export interface Attrs { a: string; b: number; }
          export {};
        }
        export = Library;
      `,
      }
    )
    expect(result.diagnostics).toStrictEqual([])
    expect(
      result.items.map((item) => ({
        complete: item.propertiesComplete,
        properties: item.properties.map((property) => ({
          name: property.name,
          type: property.type,
        })),
      }))
    ).toStrictEqual([
      { complete: true, properties: [{ name: "b", type: "number" }] },
      { complete: true, properties: [{ name: "b", type: "number" }] },
    ])
  })

  it("keeps library namespace contexts eligible for local type resolution", async () => {
    const file = path.join(root, "lib.d.ts")
    const reader = new DeclarationReader({
      libFiles: [file],
      declarationFiles: new Map([
        [
          file,
          `
        declare namespace Library { interface Helper { local: true; } interface Public extends Helper {} }
      `,
        ],
      ]),
    })
    await reader.loadLibraries()
    const module = await reader.read(file)
    const resolved = await reader.resolve(module, "Library.Public")
    expect(resolved).toBeDefined()
    const properties = await new TypeProperties(reader).declaration(resolved!, {
      module: resolved!.module,
      bindings: new Map(),
    })
    expect(properties).toMatchObject({ complete: true, items: [{ name: "local", type: "true" }] })
    expect(reader.diagnostics).toStrictEqual([])
  })

  it("stops cyclic aliases and reports unsupported ambient modules and assignment expressions", async () => {
    const result = await extract(
      `
      import type { Missing } from "./first";
      declare module "ambient-package" { interface Ignored {} }
      export interface Public extends Missing {}
    `,
      {
        "first.d.ts": 'export { Missing } from "./second";',
        "second.d.ts": 'export { Missing } from "./first";',
      }
    )
    expect(result.items[0].propertiesComplete).toBe(false)
    expect(result.diagnostics.map((item) => item.message)).toStrictEqual([
      "String-literal ambient modules are not expanded by declaration extraction.",
      "Could not expand properties of Missing.",
    ])
    const assignment = await extract("export = createLibrary();", {})
    expect(assignment.diagnostics[0].message).toContain("export = assignments")
  })

  it("keeps unresolved private imports from falling back to shared names or built-in utilities", async () => {
    const result = await extract(
      `
      declare namespace N { interface Pick<T, K> { shared: true; } }
      declare namespace N {
        namespace Internal {}
        import Pick = Internal.Missing;
        interface Public extends Pick<{ value: string }, "value"> {}
      }
      export interface Public extends N.Public {}
    `,
      {}
    )
    expect(result.items[0]).toMatchObject({ propertiesComplete: false, properties: [] })
    expect(result.diagnostics.map((item) => item.message)).toStrictEqual([
      "Could not expand properties of Pick.",
    ])
  })

  it("diagnoses export-assignment entry pages while retaining clean dependency member resolution", async () => {
    const result = await extract(
      `
      declare namespace Library { interface Options { value: string; } }
      export = Library;
    `,
      {}
    )
    expect(result.items).toStrictEqual([])
    expect(result.diagnostics.map((item) => item.message)).toStrictEqual([
      "Documentation pages for export = entry points are not supported.",
    ])
  })
})
