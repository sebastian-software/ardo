import { type DeclarationReflection, ReflectionKind } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import {
  buildLink,
  getModuleNameFromPath,
  getSlug,
  type GroupedReflections,
  renderCommentShort,
  sortReflectionsByName,
} from "./generator-shared"

export function generateCategoryIndexPages(
  context: TypeDocRuntimeContext,
  grouped: GroupedReflections
): GeneratedApiDoc[] {
  const pages: GeneratedApiDoc[] = []

  pushIfNotNull(pages, createComponentsIndexPage(context, grouped.componentItems))
  pushIfNotNull(pages, createFunctionsIndexPage(context, grouped.functionsByFile))
  pushIfNotNull(pages, createInterfacesIndexPage(context, grouped.standaloneItems))
  pushIfNotNull(pages, createTypesIndexPage(context, grouped.typesByFile))
  pushIfNotNull(pages, createClassesIndexPage(context, grouped.standaloneItems))

  return pages
}

function pushIfNotNull(docs: GeneratedApiDoc[], doc: GeneratedApiDoc | null): void {
  if (doc != null) {
    docs.push(doc)
  }
}

function createComponentsIndexPage(
  context: TypeDocRuntimeContext,
  components: DeclarationReflection[]
): GeneratedApiDoc | null {
  if (components.length === 0) {
    return null
  }

  return {
    content: renderSimpleItemIndex({
      basePath: context.basePath,
      category: "components",
      items: components,
      title: "Components",
    }),
    frontmatter: { sidebar: false, title: "Components" },
    path: "components/index.md",
  }
}

function createInterfacesIndexPage(
  context: TypeDocRuntimeContext,
  standaloneItems: DeclarationReflection[]
): GeneratedApiDoc | null {
  const interfaces = standaloneItems.filter((item) => item.kind === ReflectionKind.Interface)
  if (interfaces.length === 0) {
    return null
  }

  return {
    content: renderSimpleItemIndex({
      basePath: context.basePath,
      category: "interfaces",
      items: interfaces,
      title: "Interfaces",
    }),
    frontmatter: { sidebar: false, title: "Interfaces" },
    path: "interfaces/index.md",
  }
}

function createClassesIndexPage(
  context: TypeDocRuntimeContext,
  standaloneItems: DeclarationReflection[]
): GeneratedApiDoc | null {
  const classes = standaloneItems.filter((item) => item.kind === ReflectionKind.Class)
  if (classes.length === 0) {
    return null
  }

  return {
    content: renderSimpleItemIndex({
      basePath: context.basePath,
      category: "classes",
      items: classes,
      title: "Classes",
    }),
    frontmatter: { sidebar: false, title: "Classes" },
    path: "classes/index.md",
  }
}

function renderSimpleItemIndex(params: {
  basePath: string
  category: string
  items: DeclarationReflection[]
  title: string
}): string {
  const lines: string[] = [`# ${params.title}`, ""]
  const sortedItems = sortReflectionsByName(params.items)

  for (const item of sortedItems) {
    const summary = item.comment?.summary
    const description = summary == null ? "" : ` - ${renderCommentShort(summary)}`
    const link = buildLink(params.basePath, params.category, getSlug(item.name))
    lines.push(`- [${item.name}](${link})${description}`)
  }

  lines.push("")
  return lines.join("\n")
}

function createFunctionsIndexPage(
  context: TypeDocRuntimeContext,
  functionsByFile: Map<string, DeclarationReflection[]>
): GeneratedApiDoc | null {
  if (functionsByFile.size === 0) {
    return null
  }

  return {
    content: renderModuleIndex({
      basePath: context.basePath,
      category: "functions",
      modules: functionsByFile,
      packageNameCache: context.packageNameCache,
      title: "Functions",
    }),
    frontmatter: { sidebar: false, title: "Functions" },
    path: "functions/index.md",
  }
}

function createTypesIndexPage(
  context: TypeDocRuntimeContext,
  typesByFile: Map<string, DeclarationReflection[]>
): GeneratedApiDoc | null {
  if (typesByFile.size === 0) {
    return null
  }

  return {
    content: renderModuleIndex({
      basePath: context.basePath,
      category: "types",
      modules: typesByFile,
      packageNameCache: context.packageNameCache,
      title: "Types",
    }),
    frontmatter: { sidebar: false, title: "Types" },
    path: "types/index.md",
  }
}

function renderModuleIndex(params: {
  basePath: string
  category: string
  modules: Map<string, DeclarationReflection[]>
  packageNameCache: Map<string, string | undefined>
  title: string
}): string {
  const lines: string[] = [`# ${params.title}`, ""]
  const sortedModules = [...params.modules.entries()].sort(([left], [right]) => {
    const leftName = getModuleNameFromPath(left, params.packageNameCache)
    const rightName = getModuleNameFromPath(right, params.packageNameCache)
    return leftName.localeCompare(rightName)
  })

  for (const [sourceFile, items] of sortedModules) {
    const moduleName = getModuleNameFromPath(sourceFile, params.packageNameCache)
    const slug = getSlug(moduleName)
    const itemNames = items
      .map((item) => item.name)
      .sort()
      .join(", ")
    lines.push(
      `- [${moduleName}](${buildLink(params.basePath, params.category, slug)}) - ${itemNames}`
    )
  }

  lines.push("")
  return lines.join("\n")
}
