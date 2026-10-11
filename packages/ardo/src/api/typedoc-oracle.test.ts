import type { SignatureReflection, SomeType } from "typedoc"

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
import type { Base as PackageBase, Callable as PackageCallable } from '@ardo-oracle/base';
import type { ScopedBase } from '@ardo-oracle/base/child';
import type * as PackageNamespace from '@ardo-oracle/base';
import { Parent as PackageParent } from '@ardo-oracle/base';
export interface ExternalChild extends PackageBase<number[]> { /** Own flag. */ own: boolean; }
export interface ExternalSelection extends Pick<PackageNamespace.Base<number>, 'value'> {}
export interface ExternalSubpath extends ScopedBase<string> {}
export class GlobalError extends Error {
  /** Failure category. */ readonly code = 'failure';
}
export class GlobalTypeError extends TypeError {}
export interface GlobalErrorOptions extends Partial<Pick<Error, 'message' | 'cause'>> {}
export class ExternalClass extends PackageParent<number> {
  readonly own = true;
  readonly label = 'constant';
  readonly count = -2;
  readonly large = 42n;
}
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
type FieldNames = 'value' | 'label';
type Select<T, Keys extends keyof T = never> = Pick<T, Keys>;
type Fields<Keys extends string, Value> = Record<Keys, Value>;
type EmptyKeys = never;
type Identity<T> = T;
export interface IdentityProps extends Identity<Base<number>> {}
export interface BoundSelection extends Select<Base<number>, FieldNames> {}
export interface AliasedOmission extends Omit<Base<string>, FieldNames> {}
export interface GenericRecord extends Fields<'left' | 'right', number> {}
export interface DefaultSelection extends Select<Base<string>> {}
export interface EmptySelection extends Pick<Base<string>, EmptyKeys> {}
export interface EmptyRecord extends Record<EmptyKeys, number> {}
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
/** Render content.
 * @param code - Source text.
 * @param language - Optional language.
 * @param values - Additional values.
 * @returns Rendered content.
 */
export type Renderer = (code: string, language?: string | null, ...values: number[]) => string | undefined;
export type GenericCallback<T> = (value: T) => T[];
export type InlineReader = {
  /** Read text. @param value - The text value. @returns Read text. */
  (value: string): string;
  /** Read a number. @param value - The numeric value. @returns Read number. */
  (value: number): number;
  readonly label: string;
};
export interface CallableInterface extends PackageCallable<number> { enabled: boolean; }
declare function chooseCallback(value: string): string;
declare function chooseCallback(value: number): number;
export type TypeofAlias = typeof chooseCallback;
type ShadowMapper<T> = <T>(value: T) => T;
export type ShadowCallback = ShadowMapper<string>;
export type IntersectionCalls = ((value: string) => string) & ((value: number) => number);
export declare const namedCallback: GenericCallback<number>;
`

let temporary: string
let oracle: Awaited<ReturnType<Application["convert"]>>
let extracted: DeclarationProject

beforeAll(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-api-oracle-"))
  const entry = path.join(temporary, "api.ts")
  const tsconfig = path.join(temporary, "tsconfig.json")
  const dependency = path.join(temporary, "node_modules/@ardo-oracle/base")
  await fs.mkdir(dependency, { recursive: true })
  await fs.writeFile(
    path.join(dependency, "package.json"),
    JSON.stringify({
      name: "@ardo-oracle/base",
      type: "module",
      exports: {
        ".": { types: "./index.d.mts", default: "./runtime.mjs" },
        "./child": { types: "./child.d.mts", default: "./child.mjs" },
      },
    })
  )
  await fs.writeFile(
    path.join(dependency, "lib.d.ts"),
    "export {}; // A package module must not be mistaken for a compiler library."
  )
  await fs.writeFile(
    path.join(dependency, "index.d.mts"),
    `
    import './lib.js';
    export interface Base<T = string> {
      /** The package value. */ readonly value: T;
      /** Optional package label. */ label?: string;
      /** Package callback. */ callback: (value: T) => T;
    }
    export declare class Parent<T> {
      /** Stored package value. */ value: T;
      protected hidden: string;
      constructor(value: T);
    }
    export interface Callable<T> {
      (value: T): T[];
      readonly label: string;
    }
  `
  )
  await fs.writeFile(
    path.join(dependency, "child.d.mts"),
    `
    import type { Base } from './index.mjs';
    export interface ScopedBase<T> extends Base<T> { /** Package identifier. */ readonly id: string; }
  `
  )
  await fs.writeFile(entry, source)
  await fs.writeFile(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
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
  const compilerFiles = execFileSync(compiler, ["--project", tsconfig, "--listFilesOnly"], {
    cwd: temporary,
    encoding: "utf8",
    timeout: 15_000,
  }).split(/\r?\n/u)
  const coreLib = compilerFiles.find((file) => path.basename(file) === "lib.es5.d.ts")
  const libFiles = compilerFiles.filter(
    (file) => coreLib != null && path.dirname(file) === path.dirname(coreLib)
  )
  extracted = await extractDeclarations([path.join(temporary, "declarations/api.d.ts")], {
    libFiles,
  })
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

function callSignatures(
  reflection: DeclarationReflection,
  seen = new Set<DeclarationReflection>()
): SignatureReflection[] {
  if (seen.has(reflection)) return []
  const next = new Set(seen).add(reflection)
  return reflection.signatures ?? typeCallSignatures(reflection.type, next)
}

function typeCallSignatures(
  type: SomeType | undefined,
  seen: Set<DeclarationReflection>
): SignatureReflection[] {
  if (type?.type === "reflection") return callSignatures(type.declaration, seen)
  if (type?.type === "reference" && type.reflection instanceof DeclarationReflection)
    return callSignatures(type.reflection, seen)
  if (type?.type === "query") return typeCallSignatures(type.queryType, seen)
  if (type?.type === "intersection")
    return type.types.flatMap((part) => typeCallSignatures(part, seen))
  return []
}

function comparedSignatures(name: string) {
  const actual = extractedDeclaration(name).signatures.map((signature) => ({
    parameters: signature.parameters.map((parameter) => ({
      name: parameter.name,
      type: typeShape(parameter.type),
      optional: parameter.optional,
      rest: parameter.rest,
    })),
    returns: typeShape(signature.returnType),
  }))
  const expected = callSignatures(oracleDeclaration(name)).map((signature) => ({
    parameters: (signature.parameters ?? []).map((parameter) => ({
      name: parameter.name,
      type: typeShape(parameter.type?.toString() ?? "unknown"),
      optional: parameter.flags.isOptional,
      rest: parameter.flags.isRest,
    })),
    returns: typeShape(signature.type?.toString() ?? "unknown"),
  }))
  return { actual, expected }
}

describe("TypeDoc declaration oracle", () => {
  it.each([
    "Renderer",
    "GenericCallback",
    "InlineReader",
    "CallableInterface",
    "IntersectionCalls",
  ])("matches callable parameters, modifiers, and returns for %s", (name) => {
    const { actual, expected } = comparedSignatures(name)
    expect(actual.length).toBeGreaterThan(0)
    expect(actual).toStrictEqual(expected)
  })

  it.each([
    { name: "TypeofAlias", expression: "typeof chooseCallback", returns: ["string", "number"] },
    { name: "ShadowCallback", expression: "ShadowMapper<string>", returns: ["T"] },
  ])(
    "expands private callable helpers while TypeDoc preserves $name as an expression",
    ({ name, expression, returns }) => {
      expect(oracleDeclaration(name).type?.toString()).toBe(expression)
      expect(callSignatures(oracleDeclaration(name))).toStrictEqual([])
      expect(
        extractedDeclaration(name).signatures.map((signature) => signature.returnType)
      ).toStrictEqual(returns)
    }
  )

  it("specializes a callable variable whose TypeDoc reference retains generic parameters", () => {
    expect(oracleDeclaration("namedCallback").type?.toString()).toBe("GenericCallback<number>")
    const { actual, expected } = comparedSignatures("namedCallback")
    expect(actual).toStrictEqual([
      {
        parameters: [{ name: "value", type: typeShape("number"), optional: false, rest: false }],
        returns: typeShape("number[]"),
      },
    ])
    expect(expected).toStrictEqual([
      {
        parameters: [{ name: "value", type: typeShape("T"), optional: false, rest: false }],
        returns: typeShape("T[]"),
      },
    ])
  })

  it.each(["Renderer", "InlineReader"])("matches callable documentation for %s", (name) => {
    const actual = extractedDeclaration(name).signatures.map((signature) => ({
      summary: summary(signature.comment.description),
      parameters: signature.parameters.map((parameter) => summary(parameter.description)),
      returns: summary(signature.comment.tags.find((tag) => tag.name === "returns")?.text ?? ""),
    }))
    const expected = callSignatures(oracleDeclaration(name)).map((signature) => ({
      summary: summary(
        (signature.comment != null && signature.comment.summary.length > 0
          ? signature.comment.summary
          : (oracleDeclaration(name).comment?.summary ?? [])
        )
          .map((part) => part.text)
          .join("")
      ),
      parameters: (signature.parameters ?? []).map((parameter) =>
        summary((parameter.comment?.summary ?? []).map((part) => part.text).join(""))
      ),
      returns: summary(
        (signature.comment?.getTag("@returns")?.content ?? []).map((part) => part.text).join("")
      ),
    }))
    expect(actual).toStrictEqual(expected)
  })

  it.each([
    "ExternalChild",
    "ExternalSelection",
    "ExternalClass",
    "GlobalError",
    "GlobalTypeError",
    "GlobalErrorOptions",
    "GenericChild",
    "DefaultChild",
    "OptionalProps",
    "RequiredProps",
    "SelectedProps",
    "OmittedProps",
    "ReadonlyProps",
    "IdentityProps",
    "BoundSelection",
    "AliasedOmission",
    "GenericRecord",
    "DefaultSelection",
    "EmptySelection",
    "EmptyRecord",
    "IntersectionProps",
    "ChildClass",
    "Accessors",
  ])("matches properties, types, modifiers, and comments for %s", (name) => {
    expect(extractedDeclaration(name).propertiesComplete).toBe(true)
    expect(extractedProperties(name)).toStrictEqual(oracleProperties(name))
  })

  it("retains inline inherited package documentation that TypeDoc omits", () => {
    const properties = extractedProperties("ExternalSubpath")
    const reference = oracleProperties("ExternalSubpath")
    expect(extractedDeclaration("ExternalSubpath").propertiesComplete).toBe(true)
    expect(properties.find((property) => property.name === "id")?.summary).toBe(
      "Package identifier."
    )
    expect(reference.find((property) => property.name === "id")?.summary).toBe("")
    expect(
      properties.map((property) =>
        property.name === "id" ? { ...property, summary: "" } : property
      )
    ).toStrictEqual(reference)
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
