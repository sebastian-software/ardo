import type { TSType } from "oxc-parser"

import type { ResolvedDeclaration } from "./declaration-project"
import type { TypeContext, TypeValue } from "./source"

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
        module: resolved.module,
        bindings: new Map(bindings),
        node: parameter.default,
      })
  }
  return bindings
}
