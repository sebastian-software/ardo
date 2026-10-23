import type {
  Function as OxcFunction,
  TSCallSignatureDeclaration,
  TSConstructSignatureDeclaration,
  TSFunctionType,
  TSMethodSignature,
} from "oxc-parser"

import type { TypeContext } from "./source"
import type { ApiComment, ApiParameter, ApiSignature } from "./types"

import { getParameterDescription } from "./comments"
import { formatType, parameterType } from "./source"

export type Callable =
  | OxcFunction
  | TSCallSignatureDeclaration
  | TSConstructSignatureDeclaration
  | TSFunctionType
  | TSMethodSignature

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
  const name = parameterName(argument, annotation == null ? "" : formatType(annotation, context))
  return {
    name,
    rest,
    optional: pattern.optional ?? false,
    type: annotation == null ? "/* type not declared */" : formatType(annotation, context),
    description: getParameterDescription(comment, name),
  }
}

/**
 * A destructured parameter has no name of its own. Props objects read as
 * `props`, other objects as `options`, arrays as `values`.
 */
function parameterName(
  argument: { type: string; name?: string; left?: unknown },
  type: string
): string {
  const target =
    argument.type === "AssignmentPattern" &&
    typeof argument.left === "object" &&
    argument.left != null
      ? (argument.left as { type: string; name?: string })
      : argument
  if (target.type === "Identifier" && target.name != null) return target.name
  if (target.type === "ArrayPattern") return "values"
  return /Props(?:<.*>)?$/u.test(type.trim()) ? "props" : "options"
}
