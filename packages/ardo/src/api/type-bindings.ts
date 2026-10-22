import type { TSType } from "oxc-parser"

import type { DeclarationRecord, ResolvedDeclaration } from "./declaration-project"
import type { TypeContext, TypeValue } from "./source"

import { formatType } from "./source"

export type Reference = { name: string; args: TSType[] }

/** Explicit type arguments retain their caller's expansion scope. */
export class ArgumentBindings {
  private readonly scopes = new WeakMap<TypeValue, Set<string>>()

  bind(
    resolved: ResolvedDeclaration,
    value: { args: TSType[]; context: TypeContext },
    seen: Set<string>
  ): Map<string, TypeValue> {
    const bindings = bindArguments(resolved, value.args, value.context)
    for (const argument of bindings.values())
      if (value.args.includes(argument.node)) this.scopes.set(argument, seen)
    return bindings
  }

  scope(value: TypeValue, fallback: Set<string>): Set<string> {
    return this.scopes.get(value) ?? fallback
  }
}

export function baseReferences(node: DeclarationRecord["node"], context: TypeContext): Reference[] {
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

export function bindArguments(
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
        module: resolved.records.at(0)?.module ?? resolved.module,
        bindings: new Map(bindings),
        node: parameter.default,
      })
  }
  return bindings
}
