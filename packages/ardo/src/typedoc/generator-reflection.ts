import { type DeclarationReflection, ReflectionKind } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import { appendReflectionCommentTags } from "./generator-reflection-tags"
import {
  renderHierarchy,
  renderMethod,
  renderProperty,
  renderSignature,
  renderTypeParameters,
} from "./generator-render"
import {
  createBreadcrumbs,
  createNavigationLine,
  getGroupUrlPrefix,
  getKindName,
  getSlug,
  getSourceUrl,
  type ReflectionNavigation,
  renderComment,
  renderCommentShort,
} from "./generator-shared"

export function generateReflectionDocs(params: {
  context: TypeDocRuntimeContext
  navigation: ReflectionNavigation
  parentPath: string
  reflection: DeclarationReflection
}): GeneratedApiDoc[] {
  const { context, navigation, parentPath, reflection } = params
  const pagePath = getReflectionPagePath(reflection, parentPath)
  const docs: GeneratedApiDoc[] = [
    generateReflectionPage({ context, navigation, pagePath, reflection }),
  ]
  const childRefs = reflection.children ?? []
  for (const child of childRefs) {
    if (hasOwnPage(child.kind)) {
      docs.push(
        ...generateReflectionDocs({
          context,
          navigation: { next: null, prev: null },
          parentPath: pagePath,
          reflection: child,
        })
      )
    }
  }
  return docs
}
function getReflectionPagePath(reflection: DeclarationReflection, parentPath: string): string {
  const slug = getSlug(reflection.name)
  if (parentPath.length > 0) {
    return `${parentPath}/${slug}`
  }
  const prefix = getGroupUrlPrefix(reflection.kind)
  return prefix.length === 0 ? slug : `${prefix}/${slug}`
}
function hasOwnPage(kind: ReflectionKind): boolean {
  return [
    ReflectionKind.Class,
    ReflectionKind.Enum,
    ReflectionKind.Interface,
    ReflectionKind.Module,
    ReflectionKind.Namespace,
  ].includes(kind)
}
export function generateReflectionPage(params: {
  context: TypeDocRuntimeContext
  navigation: ReflectionNavigation
  pagePath: string
  reflection: DeclarationReflection
}): GeneratedApiDoc {
  const { context, navigation, pagePath, reflection } = params
  const lines: string[] = []
  appendReflectionSections({
    context,
    lines,
    navigation,
    pagePath,
    reflection,
  })
  return {
    content: lines.join("\n"),
    frontmatter: {
      description:
        reflection.comment?.summary == null
          ? `${getKindName(reflection.kind)} ${reflection.name}`
          : renderCommentShort(reflection.comment.summary),
      title: reflection.name,
    },
    path: `${pagePath}.md`,
  }
}
function appendReflectionSections(params: {
  context: TypeDocRuntimeContext
  lines: string[]
  navigation: ReflectionNavigation
  pagePath: string
  reflection: DeclarationReflection
}): void {
  const { context, lines, navigation, pagePath, reflection } = params
  appendBreadcrumbs(lines, context, pagePath)
  appendTitle(lines, reflection)
  appendDescription(lines, reflection)
  appendTypeParameters(lines, reflection)
  appendHierarchy(lines, context, reflection)
  appendSignatures(lines, context, reflection)
  appendProperties(lines, reflection)
  appendMethods(lines, context, reflection)
  appendEnumMembers(lines, reflection)
  appendTypeAlias(lines, reflection)
  appendSourceSection(lines, context, reflection)
  appendReflectionCommentTags(lines, reflection)
  appendNavigation({ context, lines, navigation, reflection })
}
function appendBreadcrumbs(
  lines: string[],
  context: TypeDocRuntimeContext,
  pagePath: string
): void {
  if (!context.config.markdown.breadcrumbs) {
    return
  }
  lines.push(createBreadcrumbs(context.basePath, pagePath))
  lines.push("")
}
function appendTitle(lines: string[], reflection: DeclarationReflection): void {
  const kind = getKindName(reflection.kind)
  lines.push(`# ${kind}: ${reflection.name}`)
  lines.push("")
}
function appendDescription(lines: string[], reflection: DeclarationReflection): void {
  const summary = reflection.comment?.summary
  if (summary == null) {
    return
  }
  lines.push(renderComment(summary))
  lines.push("")
}
function appendTypeParameters(lines: string[], reflection: DeclarationReflection): void {
  const typeParameters = reflection.typeParameters ?? []
  if (typeParameters.length === 0) {
    return
  }
  lines.push("## Type Parameters")
  lines.push("")
  lines.push(renderTypeParameters(typeParameters))
  lines.push("")
}
function appendHierarchy(
  lines: string[],
  context: TypeDocRuntimeContext,
  reflection: DeclarationReflection
): void {
  if (!context.config.markdown.hierarchy) {
    return
  }
  const hierarchy = renderHierarchy(reflection)
  if (hierarchy == null) {
    return
  }
  lines.push("## Hierarchy")
  lines.push("")
  lines.push(hierarchy)
  lines.push("")
}
function appendSignatures(
  lines: string[],
  context: TypeDocRuntimeContext,
  reflection: DeclarationReflection
): void {
  const signatures = reflection.signatures ?? []
  if (signatures.length === 0) {
    return
  }
  lines.push("## Signature")
  lines.push("")
  for (const signature of signatures) {
    lines.push(renderSignature(context, signature))
    lines.push("")
  }
}
function appendProperties(lines: string[], reflection: DeclarationReflection): void {
  const children = reflection.children ?? []
  const properties = children.filter((child) => child.kind === ReflectionKind.Property)
  if (properties.length === 0) {
    return
  }
  lines.push("## Properties")
  lines.push("")
  for (const property of properties) {
    lines.push(renderProperty(property))
    lines.push("")
  }
}
function appendMethods(
  lines: string[],
  context: TypeDocRuntimeContext,
  reflection: DeclarationReflection
): void {
  const children = reflection.children ?? []
  const methods = children.filter((child) => child.kind === ReflectionKind.Method)
  if (methods.length === 0) {
    return
  }
  lines.push("## Methods")
  lines.push("")
  for (const method of methods) {
    lines.push(renderMethod(context, method))
    lines.push("")
  }
}
function appendEnumMembers(lines: string[], reflection: DeclarationReflection): void {
  const children = reflection.children ?? []
  const enumMembers = children.filter((child) => child.kind === ReflectionKind.EnumMember)
  if (enumMembers.length === 0) {
    return
  }
  lines.push("## Members")
  lines.push("")
  lines.push("| Member | Value | Description |")
  lines.push("|--------|-------|-------------|")
  for (const member of enumMembers) {
    const value = member.defaultValue ?? ""
    const summary = member.comment?.summary
    const description = summary == null ? "" : renderCommentShort(summary)
    lines.push(`| \`${member.name}\` | \`${value}\` | ${description} |`)
  }
  lines.push("")
}
function appendTypeAlias(lines: string[], reflection: DeclarationReflection): void {
  if (reflection.kind !== ReflectionKind.TypeAlias || reflection.type == null) {
    return
  }
  lines.push("## Type")
  lines.push("")
  lines.push("```typescript")
  lines.push(`type ${reflection.name} = ${reflection.type.toString()}`)
  lines.push("```")
  lines.push("")
}
function appendSourceSection(
  lines: string[],
  context: TypeDocRuntimeContext,
  reflection: DeclarationReflection
): void {
  if (!context.config.markdown.sourceLinks) {
    return
  }
  const source = reflection.sources?.[0]
  if (source == null) {
    return
  }
  lines.push("## Source")
  lines.push("")
  const sourceUrl = getSourceUrl(
    context.config.markdown.sourceBaseUrl,
    source.fileName,
    source.line
  )
  if (sourceUrl == null) {
    lines.push(`${source.fileName}:${source.line}`)
  } else {
    lines.push(`[${source.fileName}:${source.line}](${sourceUrl})`)
  }
  lines.push("")
}
function appendNavigation(params: {
  context: TypeDocRuntimeContext
  lines: string[]
  navigation: ReflectionNavigation
  reflection: DeclarationReflection
}): void {
  const { context, lines, navigation, reflection } = params
  const line = createNavigationLine({
    basePath: context.basePath,
    kind: reflection.kind,
    navigation,
  })
  if (line == null) {
    return
  }
  lines.push("---")
  lines.push("")
  lines.push(line)
  lines.push("")
}
