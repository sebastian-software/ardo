import type { TSType } from "oxc-parser"

import type {
  DeclarationReader,
  DeclarationRecord,
  ResolvedDeclaration,
} from "./declaration-project"
import type { Properties } from "./members"
import type { TypeContext, TypeValue } from "./source"

import { mergeProperties, readClassMembers, readMembers } from "./members"
import { resolveCallables } from "./signatures"
import { annotationOf, formatType } from "./source"

type Reference = { name: string; args: TSType[] }
const unexpanded = new Set([
  "TSUnionType",
  "TSConditionalType",
  "TSMappedType",
  "TSIndexedAccessType",
  "TSImportType",
])

export class TypeProperties {
  constructor(private readonly reader: DeclarationReader) {}

  of(value: TypeValue, seen = new Set<string>()): Properties {
    const { node } = value
    if (node.type === "TSTypeLiteral") return readMembers(node.members, value, this.reader)
    if (node.type === "TSParenthesizedType")
      return this.of({ ...value, node: node.typeAnnotation }, seen)
    if (node.type === "TSIntersectionType")
      return mergeProperties(
        node.types.map((type) => this.of({ ...value, node: type }, seen)),
        "intersection"
      )
    if (node.type === "TSTypeReference")
      return this.reference(
        { name: formatType(node.typeName, value), args: node.typeArguments?.params ?? [] },
        value,
        seen
      )
    if (node.type === "TSTypeQuery") {
      const resolved = this.reader.resolve(value.module, formatType(node.exprName, value))
      if (resolved != null)
        return this.declaration(resolved, { module: resolved.module, bindings: new Map() }, seen)
      return this.incomplete(value, `Could not expand ${formatType(node, value)}.`)
    }
    if (unexpanded.has(node.type))
      return this.incomplete(
        value,
        `Property expansion is not supported for ${formatType(node, value)}; its type expression is preserved.`
      )
    return { items: [], complete: true }
  }

  declaration(
    resolved: ResolvedDeclaration,
    context: TypeContext,
    seen = new Set<string>()
  ): Properties {
    const key = `${resolved.module.file}:${resolved.name}`
    if (seen.has(key))
      return this.incomplete(context, `Recursive expansion of ${resolved.name} was stopped.`)
    const next = new Set(seen).add(key)
    return mergeProperties(
      resolved.records.map((record) => this.definition(record.node, context, next))
    )
  }

  private definition(
    node: DeclarationRecord["node"],
    context: TypeContext,
    seen: Set<string>
  ): Properties {
    if (node.type === "TSTypeAliasDeclaration")
      return this.of({ ...context, node: node.typeAnnotation }, seen)
    if (node.type === "VariableDeclarator") {
      const annotation = annotationOf(node.id)
      return annotation == null
        ? { items: [], complete: true }
        : this.of({ ...context, node: annotation }, seen)
    }
    const inherited = basesOf(node, context).map((reference) =>
      this.reference(reference, context, seen)
    )
    const own =
      node.type === "TSInterfaceDeclaration"
        ? readMembers(node.body.body, context, this.reader)
        : node.type === "ClassDeclaration"
          ? readClassMembers(node, context, this.reader)
          : { items: [], complete: true }
    const bases = inherited.map((base) => ({
      ...base,
      items: base.items.filter((item) => item.kind !== "constructor"),
    }))
    return mergeProperties([...bases, own])
  }

  private reference(reference: Reference, context: TypeContext, seen: Set<string>): Properties {
    const bound = context.bindings.get(reference.name)
    if (bound != null) return this.of(bound, seen)
    const resolved = this.reader.resolve(context.module, reference.name)
    if (resolved != null)
      return this.declaration(
        resolved,
        { module: resolved.module, bindings: bindArguments(resolved, reference.args, context) },
        seen
      )
    if (!context.module.imports.has(reference.name)) {
      const utility = this.utility(reference, context, seen)
      if (utility != null) return utility
    }
    return this.incomplete(context, `Could not expand properties of ${reference.name}.`)
  }

  private utility(
    reference: Reference,
    context: TypeContext,
    seen: Set<string>
  ): Properties | undefined {
    const first = reference.args.at(0)
    if (first == null) return undefined
    if (reference.name === "ReturnType") return this.returnType(first, context, seen)
    if (!["Pick", "Omit", "Partial", "Required", "Readonly"].includes(reference.name))
      return undefined
    const source = this.of({ ...context, node: first }, seen)
    if (reference.name === "Pick" || reference.name === "Omit") {
      const keys = literalKeys(reference.args.at(1))
      if (keys == null)
        return this.incomplete(
          context,
          `Only literal property names are supported in ${reference.name}.`
        )
      return {
        ...source,
        items: source.items.filter(
          (item) => keys.includes(item.name) === (reference.name === "Pick")
        ),
      }
    }
    return {
      ...source,
      items: source.items.map((item) => ({
        ...item,
        optional:
          reference.name === "Partial"
            ? true
            : reference.name === "Required"
              ? false
              : item.optional,
        readonly: reference.name === "Readonly" ? true : item.readonly,
      })),
    }
  }

  private returnType(node: TSType, context: TypeContext, seen: Set<string>): Properties {
    const resolved =
      node.type === "TSTypeQuery"
        ? this.reader.resolve(context.module, formatType(node.exprName, context))
        : undefined
    const record = resolved?.records.at(-1)
    if (record != null && resolved != null) {
      const callable = resolveCallables(
        record,
        { module: resolved.module, bindings: new Map() },
        { reader: this.reader }
      ).at(-1)
      if (callable?.node.returnType != null)
        return this.of({ ...callable.context, node: callable.node.returnType.typeAnnotation }, seen)
    }
    return this.incomplete(context, "Could not expand this ReturnType expression.")
  }

  private incomplete(context: TypeContext, message: string): Properties {
    this.reader.report(context.module, message)
    return { items: [], complete: false }
  }
}

function basesOf(node: DeclarationRecord["node"], context: TypeContext): Reference[] {
  if (node.type === "TSInterfaceDeclaration")
    return node.extends.map((base) => ({
      name: formatType(base.expression, context),
      args: base.typeArguments?.params ?? [],
    }))
  if (node.type === "ClassDeclaration" && node.superClass != null)
    return [
      { name: formatType(node.superClass, context), args: node.superTypeArguments?.params ?? [] },
    ]
  return []
}

function bindArguments(
  resolved: ResolvedDeclaration,
  args: TSType[],
  context: TypeContext
): Map<string, TypeValue> {
  const bindings = new Map<string, TypeValue>()
  const declaration = resolved.records.at(0)?.node
  const parameters =
    declaration != null && "typeParameters" in declaration
      ? (declaration.typeParameters?.params ?? [])
      : []
  for (const [index, parameter] of parameters.entries()) {
    const argument = args.at(index)
    if (argument != null) bindings.set(parameter.name.name, { ...context, node: argument })
    else if (parameter.default != null)
      bindings.set(parameter.name.name, {
        module: resolved.module,
        bindings: new Map(bindings),
        node: parameter.default,
      })
  }
  return bindings
}

function literalKeys(node: TSType | undefined): string[] | undefined {
  if (
    node?.type === "TSLiteralType" &&
    node.literal.type === "Literal" &&
    typeof node.literal.value === "string"
  )
    return [node.literal.value]
  if (node?.type !== "TSUnionType") return undefined
  const keys = node.types.map((type) => literalKeys(type))
  return keys.every((key) => key != null) ? keys.flat() : undefined
}
