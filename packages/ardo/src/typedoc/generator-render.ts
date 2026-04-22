import type {
  DeclarationReflection,
  ParameterReflection,
  SignatureReflection,
  TypeParameterReflection,
} from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"

import { renderComment, renderCommentShort } from "./generator-shared"

export function renderSignature(
  context: TypeDocRuntimeContext,
  signature: SignatureReflection
): string {
  const lines: string[] = []

  appendCodeFenceStart(lines, context)
  lines.push(getSignatureLine(signature))
  appendCodeFenceEnd(lines, context)
  appendSignatureParameters(lines, signature)
  appendSignatureReturn(lines, signature)

  return lines.join("\n")
}

function appendCodeFenceStart(lines: string[], context: TypeDocRuntimeContext): void {
  if (context.config.markdown.codeBlocks) {
    lines.push("```typescript")
  }
}

function appendCodeFenceEnd(lines: string[], context: TypeDocRuntimeContext): void {
  if (context.config.markdown.codeBlocks) {
    lines.push("```")
  }
}

function getSignatureLine(signature: SignatureReflection): string {
  const typeParameters = renderTypeParameterNames(signature.typeParameters)
  const parameters = renderSignatureParameters(signature)
  const returnType = signature.type == null ? "" : `: ${signature.type.toString()}`
  return `function ${signature.name}${typeParameters}(${parameters})${returnType}`
}

function renderTypeParameterNames(typeParameters: SignatureReflection["typeParameters"]): string {
  if (typeParameters == null || typeParameters.length === 0) {
    return ""
  }
  return `<${typeParameters.map((item) => item.name).join(", ")}>`
}

function renderSignatureParameters(signature: SignatureReflection): string {
  const parameters = signature.parameters ?? []
  return parameters
    .map((parameter) => {
      const optional = parameter.flags.isOptional ? "?" : ""
      const type = parameter.type == null ? "" : `: ${parameter.type.toString()}`
      return `${parameter.name}${optional}${type}`
    })
    .join(", ")
}

function appendSignatureParameters(lines: string[], signature: SignatureReflection): void {
  const parameters = signature.parameters ?? []
  if (parameters.length === 0) {
    return
  }

  lines.push("")
  lines.push("### Parameters")
  lines.push("")
  lines.push("| Name | Type | Description |")
  lines.push("|------|------|-------------|")

  for (const parameter of parameters) {
    lines.push(renderSignatureParameterRow(parameter))
  }
}

function renderSignatureParameterRow(parameter: ParameterReflection): string {
  const optional = parameter.flags.isOptional ? " (optional)" : ""
  const type = parameter.type == null ? "-" : `\`${parameter.type.toString()}\``
  const summary = parameter.comment?.summary
  const description = summary == null ? "-" : renderCommentShort(summary)
  return `| ${parameter.name}${optional} | ${type} | ${description} |`
}

function appendSignatureReturn(lines: string[], signature: SignatureReflection): void {
  const returnType = signature.type
  if (returnType == null || returnType.toString() === "void") {
    return
  }

  lines.push("")
  lines.push("### Returns")
  lines.push("")
  lines.push(`\`${returnType.toString()}\``)

  const returnTag = signature.comment?.blockTags.find((tag) => tag.tag === "@returns")
  if (returnTag == null) {
    return
  }

  lines.push("")
  lines.push(renderComment(returnTag.content))
}

export function renderProperty(property: DeclarationReflection): string {
  const lines: string[] = []
  const flags = getPropertyFlags(property)

  lines.push(`### ${property.name}`)
  if (flags.length > 0) {
    lines.push(`*${flags.join(", ")}*`)
  }
  lines.push("")

  appendPropertyType(lines, property)
  appendPropertySummary(lines, property)
  appendPropertyDefaultValue(lines, property)

  return lines.join("\n")
}

function getPropertyFlags(property: DeclarationReflection): string[] {
  const flags: string[] = []
  if (property.flags.isOptional) flags.push("optional")
  if (property.flags.isReadonly) flags.push("readonly")
  if (property.flags.isStatic) flags.push("static")
  return flags
}

function appendPropertyType(lines: string[], property: DeclarationReflection): void {
  if (property.type == null) {
    return
  }
  lines.push("```typescript")
  lines.push(`${property.name}: ${property.type.toString()}`)
  lines.push("```")
  lines.push("")
}

function appendPropertySummary(lines: string[], property: DeclarationReflection): void {
  const summary = property.comment?.summary
  if (summary != null) {
    lines.push(renderComment(summary))
  }
}

function appendPropertyDefaultValue(lines: string[], property: DeclarationReflection): void {
  if (property.defaultValue == null || property.defaultValue.length === 0) {
    return
  }
  lines.push("")
  lines.push(`**Default:** \`${property.defaultValue}\``)
}

export function renderMethod(
  context: TypeDocRuntimeContext,
  method: DeclarationReflection
): string {
  const lines: string[] = []
  lines.push(`### ${method.name}()`)
  lines.push("")

  const signatures = method.signatures ?? []
  for (const signature of signatures) {
    appendMethodSignature(lines, context, signature)
  }

  return lines.join("\n")
}

function appendMethodSignature(
  lines: string[],
  context: TypeDocRuntimeContext,
  signature: SignatureReflection
): void {
  const summary = signature.comment?.summary
  if (summary != null) {
    lines.push(renderComment(summary))
    lines.push("")
  }

  lines.push(renderSignature(context, signature))
  lines.push("")
}

export function renderTypeParameters(typeParameters: TypeParameterReflection[]): string {
  const lines: string[] = []
  lines.push("| Name | Constraint | Default | Description |")
  lines.push("|------|------------|---------|-------------|")

  for (const typeParameter of typeParameters) {
    lines.push(renderTypeParameterRow(typeParameter))
  }

  return lines.join("\n")
}

function renderTypeParameterRow(typeParameter: TypeParameterReflection): string {
  const constraint = typeParameter.type == null ? "-" : `\`${typeParameter.type.toString()}\``
  const defaultValue =
    typeParameter.default == null ? "-" : `\`${typeParameter.default.toString()}\``
  const summary = typeParameter.comment?.summary
  const description = summary == null ? "-" : renderCommentShort(summary)
  return `| ${typeParameter.name} | ${constraint} | ${defaultValue} | ${description} |`
}

export function renderHierarchy(reflection: DeclarationReflection): null | string {
  const lines: string[] = []

  appendHierarchySection(lines, "**Extends:**", reflection.extendedTypes)
  appendHierarchySection(lines, "**Implements:**", reflection.implementedTypes)
  appendHierarchySection(lines, "**Extended by:**", reflection.extendedBy)
  appendHierarchySection(lines, "**Implemented by:**", reflection.implementedBy)

  return lines.length === 0 ? null : lines.join("\n")
}

function appendHierarchySection(
  lines: string[],
  title: string,
  types: DeclarationReflection["extendedTypes"]
): void {
  if (types == null || types.length === 0) {
    return
  }

  lines.push(title)
  for (const item of types) {
    lines.push(`- \`${item.toString()}\``)
  }
}
