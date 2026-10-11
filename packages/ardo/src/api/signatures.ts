import type {
  Function as OxcFunction,
  TSCallSignatureDeclaration,
  TSConstructSignatureDeclaration,
  TSFunctionType,
  TSMethodSignature,
} from "oxc-parser"

import type { DeclarationReader, DeclarationRecord } from "./declaration-project"
import type { TypeContext } from "./source"
import type { ApiComment, ApiParameter, ApiSignature } from "./types"

import { getParameterDescription } from "./comments"
import { annotationOf, formatType, parameterType } from "./source"

export type Callable =
  | OxcFunction
  | TSCallSignatureDeclaration
  | TSConstructSignatureDeclaration
  | TSFunctionType
  | TSMethodSignature
type ResolvedCallable = { node: Callable; context: TypeContext; comment: ApiComment }

export function resolveCallables(
  record: DeclarationRecord,
  context: TypeContext,
  options: { reader: DeclarationReader; seen?: Set<string> }
): ResolvedCallable[] {
  const { node, comment } = record
  if (node.type === "TSDeclareFunction" || node.type === "FunctionDeclaration")
    return [{ node, context, comment }]
  if (node.type !== "VariableDeclarator") return []
  const type = annotationOf(node.id)
  if (type?.type === "TSFunctionType") return [{ node: type, context, comment }]
  if (type?.type !== "TSTypeQuery") return []
  const target = options.reader.resolve(context.module, formatType(type.exprName, context))
  if (target == null) return []
  const key = `${target.module.file}:${target.name}`
  if (options.seen?.has(key)) return []
  const local = { module: target.module, bindings: new Map() }
  return target.records.flatMap((item) =>
    resolveCallables(item, local, { reader: options.reader, seen: new Set(options.seen).add(key) })
  )
}

export function readSignature(
  node: Callable,
  context: TypeContext,
  metadata: { name: string; comment: ApiComment }
): ApiSignature {
  const bindings = new Map(context.bindings)
  for (const parameter of node.typeParameters?.params ?? []) bindings.delete(parameter.name.name)
  const local = { ...context, bindings }
  const parameters = node.params.map((parameter) =>
    readParameter(parameter, local, metadata.comment)
  )
  const returnType =
    node.returnType == null ? "" : formatType(node.returnType.typeAnnotation, local)
  const generic = node.typeParameters == null ? "" : formatType(node.typeParameters, local)
  const params = parameters
    .map(
      (parameter) =>
        `${parameter.rest ? "..." : ""}${parameter.name}${parameter.optional ? "?" : ""}: ${parameter.type}`
    )
    .join(", ")
  return {
    text: `${metadata.name}${generic}(${params})${returnType === "" ? "" : `: ${returnType}`}`,
    parameters,
    returnType,
    comment: metadata.comment,
  }
}

function readParameter(
  parameter: Callable["params"][number],
  context: TypeContext,
  comment: ApiComment
): ApiParameter {
  const pattern = parameter.type === "TSParameterProperty" ? parameter.parameter : parameter
  const rest = pattern.type === "RestElement"
  const argument = rest ? pattern.argument : pattern
  const annotation = parameterType(parameter)
  const name =
    argument.type === "Identifier" ? argument.name : formatType(argument, context).split(":")[0]
  return {
    name,
    rest,
    optional: pattern.optional ?? false,
    type: annotation == null ? "/* type not declared */" : formatType(annotation, context),
    description: getParameterDescription(comment, name),
  }
}
