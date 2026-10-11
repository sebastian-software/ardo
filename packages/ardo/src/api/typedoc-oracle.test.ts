import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseSync } from "oxc-parser"
import { Application, DeclarationReflection, ReflectionKind, TSConfigReader } from "typedoc"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { ApiDeclaration, DeclarationProject } from "./types"

import { extractDeclarations } from "./index"

const source = `
export interface Base<T = string> {
  /** The stored value. */
  readonly value: T;
  /** Optional label. */
  label?: string;
  /** Value callback. */
  callback: (value: T) => T;
}
interface Middle<U> extends Base<U[]> {
  /** Middle flag. */
  middle: boolean;
}
export interface GenericChild extends Middle<number> {
  /** Own flag. */
  own: boolean;
}
export interface DefaultChild extends Base {}
export interface OptionalProps extends Partial<Base<string>> {}
export interface RequiredProps extends Required<Base<string>> {}
export interface SelectedProps extends Pick<Base<number>, 'value' | 'label'> {}
export interface OmittedProps extends Omit<Base<number>, 'callback'> {}
export interface ReadonlyProps extends Readonly<Base<string>> {}
type Combined<T> = Base<T> & {
  /** Enabled flag. */
  enabled: boolean;
};
export interface IntersectionProps extends Combined<string> {}
export interface FiniteRecord extends Readonly<Record<'open' | 'closed', boolean>> {}
declare const finiteRecord: FiniteRecord;
// @ts-expect-error The compiler must reject assignment to a readonly Record member.
finiteRecord.open = true;
export class Parent<T> {
  /** Stored class value. */
  value!: T;
  /** Optional class label. */
  label?: string;
  private hidden = 0;
  protected secret = 0;
}
export class ChildClass extends Parent<number> {
  /** Own class flag. */
  own = true;
}
export class Accessors {
  private stored = '';
  set value(value: string) { this.stored = value; }
  /** Current accessor value. */
  get value() { return this.stored; }
}
type Mapped<T> = { [Key in keyof T]: T[Key] };
export interface MappedProps extends Mapped<Base<string>> {}
type Conditional<T> = T extends Base<infer Value> ? { value: Value } : never;
export interface ConditionalProps extends Conditional<Base<number>> {}
export type AliasProps = Partial<Base<string>>;
`

let temporary: string
let oracle: Awaited<ReturnType<Application["convert"]>>
let extracted: DeclarationProject

beforeAll(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-oracle-"))
  const entry = path.join(temporary, "api.ts")
  const tsconfig = path.join(temporary, "tsconfig.json")
  await fs.writeFile(entry, source)
  await fs.writeFile(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ES2022",
        module: "ESNext",
        lib: ["ES2022"],
        types: [],
        declaration: true,
        emitDeclarationOnly: true,
        noEmitOnError: true,
        removeComments: false,
        outDir: "declarations",
      },
      files: ["api.ts"],
    })
  )
  const compiler =
    process.env.ARDO_DECLARATION_TSC ??
    fileURLToPath(new URL("../../../../node_modules/typescript/bin/tsc", import.meta.url))
  execFileSync(compiler, ["--project", tsconfig], {
    cwd: temporary,
    encoding: "utf8",
    timeout: 15_000,
  })
  const app = await Application.bootstrapWithPlugins(
    {
      entryPoints: [entry],
      tsconfig,
      plugin: [],
      excludeInternal: true,
      excludePrivate: true,
      excludeProtected: true,
      logLevel: "Error",
    },
    [new TSConfigReader()]
  )
  oracle = await app.convert()
  if (oracle == null) throw new Error("TypeDoc did not produce an oracle project.")
  extracted = await extractDeclarations([path.join(temporary, "declarations/api.d.ts")])
}, 30_000)

afterAll(async () => {
  await fs.rm(temporary, { recursive: true, force: true })
})

function oracleDeclaration(name: string): DeclarationReflection {
  const reflection = oracle?.getChildByName(name)
  if (!(reflection instanceof DeclarationReflection))
    throw new Error(`TypeDoc oracle declaration ${name} was not found.`)
  return reflection
}

function extractedDeclaration(name: string): ApiDeclaration {
  const declaration = extracted.items.find((item) => item.name === name)
  if (declaration == null) throw new Error(`Extracted declaration ${name} was not found.`)
  return declaration
}

function summary(value: string): string {
  return value.replaceAll(/\s+/gu, " ").trim()
}

/** Compare type syntax independently of whitespace, quote style, and outer parentheses. */
function typeShape(value: string): unknown {
  const result = parseSync("type.d.ts", `type Compared = ${value};`, { lang: "dts", astType: "ts" })
  const declaration = result.program.body.at(0)
  if (result.errors.length > 0 || declaration?.type !== "TSTypeAliasDeclaration")
    throw new Error(`Cannot compare the type expression ${value}.`)
  return shape(declaration.typeAnnotation)
}

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => shape(item))
  if (value == null || typeof value !== "object") return value
  if ("type" in value && value.type === "TSParenthesizedType" && "typeAnnotation" in value)
    return shape(value.typeAnnotation)
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["start", "end", "raw"].includes(key))
      .map(([key, item]) => [key, shape(item)])
  )
}

type ComparedProperty = {
  name: string
  type: unknown
  optional: boolean
  readonly: boolean
  summary: string
}

function oracleProperties(name: string): ComparedProperty[] {
  return (oracleDeclaration(name).children ?? [])
    .filter((child) => child.kindOf(ReflectionKind.Property | ReflectionKind.Accessor))
    .map((child) => {
      const type = child.type ?? child.getSignature?.type
      if (type == null) throw new Error(`TypeDoc did not describe ${name}.${child.name}.`)
      const comment = child.comment ?? child.getSignature?.comment
      return {
        name: child.name,
        type: typeShape(type.toString()),
        optional: child.flags.isOptional,
        readonly:
          child.flags.isReadonly ||
          (child.kindOf(ReflectionKind.Accessor) && child.setSignature == null),
        summary: summary((comment?.summary ?? []).map((part) => part.text).join("")),
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

function extractedProperties(name: string): ComparedProperty[] {
  return extractedDeclaration(name)
    .properties.filter((property) => property.kind === "property")
    .map((property) => ({
      name: property.name,
      type: typeShape(property.type),
      optional: property.optional,
      readonly: property.readonly,
      summary: summary(property.comment.description),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

describe("TypeDoc declaration oracle", () => {
  it.each([
    "GenericChild",
    "DefaultChild",
    "OptionalProps",
    "RequiredProps",
    "SelectedProps",
    "OmittedProps",
    "ReadonlyProps",
    "IntersectionProps",
    "ChildClass",
    "Accessors",
  ])("matches properties, types, modifiers, and comments for %s", (name) => {
    expect(extractedDeclaration(name).propertiesComplete).toBe(true)
    expect(extractedProperties(name)).toStrictEqual(oracleProperties(name))
  })

  it("preserves compiler-checked readonly Record members that TypeDoc renders without the flag", () => {
    const properties = extractedProperties("FiniteRecord")
    const reference = oracleProperties("FiniteRecord")
    expect(extractedDeclaration("FiniteRecord").propertiesComplete).toBe(true)
    expect(properties.map((property) => property.readonly)).toStrictEqual([true, true])
    expect(reference.map((property) => property.readonly)).toStrictEqual([false, false])
    expect(properties.map(({ readonly: _readonly, ...property }) => property)).toStrictEqual(
      reference.map(({ readonly: _readonly, ...property }) => property)
    )
  })

  it.each([
    { name: "MappedProps", expression: "keyof", names: ["callback", "label", "value"] },
    { name: "ConditionalProps", expression: " extends ", names: ["value"] },
  ])(
    "reports the effective-member gap TypeDoc can resolve for $name",
    ({ name, expression, names }) => {
      expect(oracleProperties(name).map((property) => property.name)).toStrictEqual(names)
      expect(extractedDeclaration(name)).toMatchObject({
        properties: [],
        propertiesComplete: false,
      })
      expect(
        extracted.diagnostics.some(
          (item) => item.message.includes("not supported") && item.message.includes(expression)
        )
      ).toBe(true)
    }
  )

  it("records that TypeDoc preserves a utility alias while the prototype adds a property table", () => {
    const reflection = oracleDeclaration("AliasProps")
    expect(reflection.children ?? []).toStrictEqual([])
    expect(reflection.type?.toString()).toBe("Partial<Base<string>>")
    expect(extractedDeclaration("AliasProps").properties).toHaveLength(3)
    expect(
      extractedDeclaration("AliasProps").properties.every((property) => property.optional)
    ).toBe(true)
  })
})
