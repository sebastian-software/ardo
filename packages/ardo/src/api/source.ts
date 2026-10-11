import type { ParamPattern, Span, TSType, TSTypeAnnotation } from "oxc-parser"

import type { DeclarationModule } from "./declaration-project"

export type TypeContext = { module: DeclarationModule; bindings: Map<string, TypeValue> }
export type TypeValue = { node: TSType } & TypeContext

export function formatType(node: Span, context: TypeContext, seen = new Set<TypeValue>()): string {
  let text = context.module.source.slice(node.start, node.end)
  const references = context.module.typeReferences.filter(
    (reference) =>
      reference.start >= node.start &&
      reference.end <= node.end &&
      reference.typeName.type === "Identifier" &&
      reference.typeArguments == null
  )
  references.sort((left, right) => right.start - left.start)
  for (const reference of references) {
    if (reference.typeName.type !== "Identifier") continue
    const value = context.bindings.get(reference.typeName.name)
    if (value == null || seen.has(value) || isShadowed(reference, context)) continue
    const expanded = formatType(value.node, value, new Set(seen).add(value))
    const replacement = [
      "TSUnionType",
      "TSIntersectionType",
      "TSFunctionType",
      "TSConditionalType",
    ].includes(value.node.type)
      ? `(${expanded})`
      : expanded
    text =
      text.slice(0, reference.start - node.start) +
      replacement +
      text.slice(reference.end - node.start)
  }
  return text
}

function isShadowed(
  reference: DeclarationModule["typeReferences"][number],
  context: TypeContext
): boolean {
  if (reference.typeName.type !== "Identifier") return false
  const name = reference.typeName.name
  return context.module.genericScopes.some(
    (scope) =>
      reference.start >= scope.start &&
      reference.end <= scope.end &&
      scope.typeParameters?.params.some((parameter) => parameter.name.name === name)
  )
}

export function parameterType(parameter: ParamPattern): TSType | undefined {
  const pattern = parameter.type === "TSParameterProperty" ? parameter.parameter : parameter
  return (
    annotationOf(pattern) ??
    (pattern.type === "RestElement" ? annotationOf(pattern.argument) : undefined)
  )
}

export function annotationOf(node: Span): TSType | undefined {
  // OXC 0.127's binding types declare annotations as null even in the TS AST.
  // Runtime TS bindings carry the same annotation nodes as properties.
  const annotated: { typeAnnotation?: null | TSTypeAnnotation } & Span = node
  return annotated.typeAnnotation?.typeAnnotation
}
