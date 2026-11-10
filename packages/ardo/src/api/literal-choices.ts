import type { TSType } from "oxc-parser"

import type { DeclarationReader } from "./declaration-project"
import type { TypeContext, TypeValue } from "./source"

import { annotationOf, formatType } from "./source"

/** Read only the checked declaration shape emitted for a const literal tuple. */
export async function resolveLiteralChoices(
  value: TypeValue,
  reader: DeclarationReader
): Promise<string[] | undefined> {
  const node = unparenthesized(value.node)
  if (
    node.type !== "TSIndexedAccessType" ||
    unparenthesized(node.indexType).type !== "TSNumberKeyword"
  )
    return undefined
  const object = unparenthesized(node.objectType)
  if (object.type !== "TSTypeQuery" || object.typeArguments != null) return undefined
  const resolved = await reader.resolve(value.module, formatType(object.exprName, value))
  const record = resolved?.records.length === 1 ? resolved.records[0] : undefined
  if (record?.node.type !== "VariableDeclarator" || record.variableKind !== "const")
    return undefined
  const annotation = annotationOf(record.node.id)
  return annotation == null
    ? undefined
    : tupleChoices(annotation, { module: record.module, bindings: new Map() })
}

function tupleChoices(annotation: TSType, context: TypeContext): string[] | undefined {
  const readonly = unparenthesized(annotation)
  if (readonly.type !== "TSTypeOperator" || readonly.operator !== "readonly") return undefined
  const tuple = unparenthesized(readonly.typeAnnotation)
  if (tuple.type !== "TSTupleType") return undefined
  const choices: string[] = []
  for (const element of tuple.elementTypes) {
    // Other element shapes retain the existing unsupported-type diagnostics.
    if (element.type !== "TSLiteralType") return undefined
    choices.push(formatType(element, context))
  }
  return [...new Set(choices)]
}

function unparenthesized(node: TSType): TSType {
  while (node.type === "TSParenthesizedType") node = node.typeAnnotation
  return node
}
