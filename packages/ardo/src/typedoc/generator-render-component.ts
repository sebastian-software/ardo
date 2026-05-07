import { DeclarationReflection, type SignatureReflection } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"

import { buildLink, type ComponentProp, getSlug, renderCommentShort } from "./generator-shared"

export function getTypeName(paramType: unknown): null | string {
  if (!isRecord(paramType)) {
    return null
  }

  if (typeof paramType.name === "string" && paramType.name.length > 0) {
    return paramType.name
  }

  if (paramType.type !== "reference") {
    return null
  }

  if (typeof paramType.qualifiedName === "string" && paramType.qualifiedName.length > 0) {
    return paramType.qualifiedName
  }

  return null
}

export function getPropsFromType(
  context: TypeDocRuntimeContext,
  paramType: unknown
): ComponentProp[] {
  const inlineProps = getInlineDeclarationProps(paramType)
  if (inlineProps.length > 0) {
    return inlineProps
  }

  const typeName = getTypeName(paramType)
  if (typeName == null) {
    return []
  }

  const reflection = findReflectionByName(context, typeName)
  if (reflection == null) {
    return []
  }

  return extractPropsFromChildren(reflection.children ?? [])
}

function getInlineDeclarationProps(paramType: unknown): ComponentProp[] {
  if (!isRecord(paramType)) {
    return []
  }

  const declaration = paramType.declaration
  if (declaration == null) {
    return []
  }

  return declaration instanceof DeclarationReflection
    ? extractPropsFromChildren(declaration.children ?? [])
    : []
}

function findReflectionByName(
  context: TypeDocRuntimeContext,
  typeName: string
): DeclarationReflection | null {
  const direct = context.project.getChildByName(typeName)
  if (direct instanceof DeclarationReflection) {
    return direct
  }

  const children = context.project.children ?? []
  for (const child of children) {
    if (child.name === typeName) {
      return child
    }
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

function extractPropsFromChildren(children: DeclarationReflection[]): ComponentProp[] {
  return children.map((child) => ({
    description: child.comment?.summary == null ? "" : renderCommentShort(child.comment.summary),
    name: child.name,
    optional: child.flags.isOptional,
    type: child.type == null ? "unknown" : child.type.toString(),
  }))
}

export function renderComponentSignature(
  context: TypeDocRuntimeContext,
  signature: SignatureReflection,
  componentName: string
): string {
  const lines: string[] = []
  const propsParam = signature.parameters?.[0]
  const props = propsParam == null ? [] : getPropsFromType(context, propsParam.type)
  const propsTypeName = propsParam == null ? null : getTypeName(propsParam.type)

  appendComponentUsageBlock(lines, componentName, props)
  appendComponentPropsTable({
    context,
    lines,
    props,
    propsTypeName,
  })

  return lines.join("\n")
}

function appendComponentUsageBlock(
  lines: string[],
  componentName: string,
  props: ComponentProp[]
): void {
  const hasChildren = props.some((prop) => prop.name === "children")
  const displayProps = props.filter((prop) => prop.name !== "children")

  lines.push("```tsx")
  lines.push(`<${componentName}`)

  if (displayProps.length > 0) {
    for (const prop of displayProps) {
      const optionalMark = prop.optional ? "?" : ""
      lines.push(`  ${prop.name}${optionalMark}={${prop.type}}`)
    }
  } else if (!hasChildren) {
    lines.push("  {...props}")
  }

  if (hasChildren) {
    lines.push(">")
    lines.push("  {children}")
    lines.push(`</${componentName}>`)
  } else {
    lines.push("/>")
  }

  lines.push("```")
}

function appendComponentPropsTable(params: {
  context: TypeDocRuntimeContext
  lines: string[]
  props: ComponentProp[]
  propsTypeName: null | string
}): void {
  const { context, lines, props, propsTypeName } = params
  if (props.length === 0) {
    return
  }

  lines.push("")
  lines.push(getPropsHeading(context.basePath, propsTypeName))

  lines.push("")
  lines.push("| Prop | Type | Required | Description |")
  lines.push("|------|------|----------|-------------|")

  for (const prop of props) {
    const required = prop.optional ? "No" : "Yes"
    const description = prop.description.length > 0 ? prop.description : "-"
    lines.push(`| ${prop.name} | \`${prop.type}\` | ${required} | ${description} |`)
  }
}

function getPropsHeading(basePath: string, propsTypeName: null | string): string {
  if (propsTypeName == null) {
    return "## Props"
  }

  const propsSlug = getSlug(propsTypeName)
  const propsLink = buildLink(basePath, "interfaces", propsSlug)
  return `## [Props](${propsLink})`
}
