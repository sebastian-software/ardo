import type { DeclarationReflection } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import {
  appendToMapList,
  buildLink,
  getKindGroupName,
  getModuleNameFromPath,
  getSlug,
  type GroupedReflections,
  renderComment,
  renderCommentShort,
  sortReflectionsByName,
} from "./generator-shared"

export function generateIndexPage(
  context: TypeDocRuntimeContext,
  grouped: GroupedReflections
): GeneratedApiDoc {
  const lines: string[] = [`# ${context.config.sidebar.title}`, "", getProjectSummary(context), ""]

  appendComponentSection(lines, context, grouped.componentItems)
  appendFunctionsSection(lines, context, grouped.functionsByFile)
  appendTypesSection(lines, context, grouped.typesByFile)
  appendStandaloneSections(lines, context, grouped.standaloneItems)

  return {
    content: lines.join("\n"),
    frontmatter: {
      description: "Auto-generated API documentation",
      sidebar_position: 0,
      title: context.config.sidebar.title,
    },
    path: "index.md",
  }
}

function getProjectSummary(context: TypeDocRuntimeContext): string {
  const summary = context.project.comment?.summary
  if (summary == null) {
    return "Auto-generated API documentation."
  }
  return renderComment(summary)
}

function appendComponentSection(
  lines: string[],
  context: TypeDocRuntimeContext,
  components: DeclarationReflection[]
): void {
  if (components.length === 0) {
    return
  }

  lines.push("## Components")
  lines.push("")

  for (const component of sortReflectionsByName(components)) {
    const description = component.comment?.summary
    const suffix = description == null ? "" : ` - ${renderCommentShort(description)}`
    const link = buildLink(context.basePath, "components", getSlug(component.name))
    lines.push(`- [${component.name}](${link})${suffix}`)
  }

  lines.push("")
}

function appendFunctionsSection(
  lines: string[],
  context: TypeDocRuntimeContext,
  functionsByFile: Map<string, DeclarationReflection[]>
): void {
  if (functionsByFile.size === 0) {
    return
  }

  lines.push("## Functions")
  lines.push("")
  lines.push(...renderModuleSectionItems(context, functionsByFile, "functions"))
  lines.push("")
}

function appendTypesSection(
  lines: string[],
  context: TypeDocRuntimeContext,
  typesByFile: Map<string, DeclarationReflection[]>
): void {
  if (typesByFile.size === 0) {
    return
  }

  lines.push("## Type Aliases")
  lines.push("")
  lines.push(...renderModuleSectionItems(context, typesByFile, "types"))
  lines.push("")
}

function renderModuleSectionItems(
  context: TypeDocRuntimeContext,
  modules: Map<string, DeclarationReflection[]>,
  category: string
): string[] {
  const sortedModules = [...modules.entries()].sort(([left], [right]) => {
    const leftName = getModuleNameFromPath(left, context.packageNameCache)
    const rightName = getModuleNameFromPath(right, context.packageNameCache)
    return leftName.localeCompare(rightName)
  })

  return sortedModules.map(([sourceFile, items]) => {
    const moduleName = getModuleNameFromPath(sourceFile, context.packageNameCache)
    const itemNames = items
      .map((item) => item.name)
      .sort()
      .join(", ")
    const link = buildLink(context.basePath, category, getSlug(moduleName))
    return `- [${moduleName}](${link}) - ${itemNames}`
  })
}

function appendStandaloneSections(
  lines: string[],
  context: TypeDocRuntimeContext,
  standaloneItems: DeclarationReflection[]
): void {
  const groups = new Map<string, DeclarationReflection[]>()
  for (const item of standaloneItems) {
    appendToMapList(groups, getKindGroupName(item.kind, item.name), item)
  }

  const orderedGroups = ["Interfaces", "Classes", "Variables", "Enums", "Other"]
  for (const groupName of orderedGroups) {
    const groupItems = groups.get(groupName)
    if (groupItems == null || groupItems.length === 0) {
      continue
    }
    appendStandaloneGroup({
      context,
      groupItems,
      groupName,
      lines,
    })
  }
}

function appendStandaloneGroup(params: {
  context: TypeDocRuntimeContext
  groupItems: DeclarationReflection[]
  groupName: string
  lines: string[]
}): void {
  const { context, groupItems, groupName, lines } = params
  lines.push(`## ${groupName}`)
  lines.push("")

  for (const item of sortReflectionsByName(groupItems)) {
    const description = item.comment?.summary
    const suffix = description == null ? "" : ` - ${renderCommentShort(description)}`
    const prefix = groupName.toLowerCase()
    const link = buildLink(context.basePath, prefix, getSlug(item.name))
    lines.push(`- [${item.name}](${link})${suffix}`)
  }

  lines.push("")
}
