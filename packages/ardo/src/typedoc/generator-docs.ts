import type { DeclarationReflection, ReflectionKind } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import { generateCategoryIndexPages } from "./generator-pages-categories"
import { generateComponentPage } from "./generator-pages-components"
import { generateGroupedFunctionsPage, generateGroupedTypesPage } from "./generator-pages-grouped"
import { generateIndexPage } from "./generator-pages-index"
import { generateReflectionDocs } from "./generator-reflection"
import {
  groupProjectChildren,
  isReactComponent,
  type ReflectionNavigation,
  sortReflectionsByName,
} from "./generator-shared"

export function generateMarkdownDocs(context: TypeDocRuntimeContext): GeneratedApiDoc[] {
  const grouped = groupProjectChildren(context.project, isReactComponent)
  const docs: GeneratedApiDoc[] = [generateIndexPage(context, grouped)]

  addGroupedFunctionPages(context, docs, grouped.functionsByFile)
  addGroupedTypePages(context, docs, grouped.typesByFile)
  addComponentPages(context, docs, grouped.componentItems)
  addStandalonePages(context, docs, grouped.standaloneItems)

  docs.push(...generateCategoryIndexPages(context, grouped))
  return docs
}

function addGroupedFunctionPages(
  context: TypeDocRuntimeContext,
  docs: GeneratedApiDoc[],
  functionsByFile: Map<string, DeclarationReflection[]>
): void {
  for (const [sourceFile, functions] of functionsByFile) {
    docs.push(generateGroupedFunctionsPage({ context, functions, sourceFile }))
  }
}

function addGroupedTypePages(
  context: TypeDocRuntimeContext,
  docs: GeneratedApiDoc[],
  typesByFile: Map<string, DeclarationReflection[]>
): void {
  for (const [sourceFile, types] of typesByFile) {
    docs.push(generateGroupedTypesPage({ context, sourceFile, types }))
  }
}

function addComponentPages(
  context: TypeDocRuntimeContext,
  docs: GeneratedApiDoc[],
  componentItems: DeclarationReflection[]
): void {
  const sorted = sortReflectionsByName(componentItems)
  for (const [index, component] of sorted.entries()) {
    docs.push(
      generateComponentPage({ component, context, navigation: getNavigation(sorted, index) })
    )
  }
}

function addStandalonePages(
  context: TypeDocRuntimeContext,
  docs: GeneratedApiDoc[],
  standaloneItems: DeclarationReflection[]
): void {
  const itemsByKind = groupStandaloneByKind(standaloneItems)

  for (const items of itemsByKind.values()) {
    const sorted = sortReflectionsByName(items)
    for (const [index, reflection] of sorted.entries()) {
      docs.push(
        ...generateReflectionDocs({
          context,
          navigation: getNavigation(sorted, index),
          parentPath: "",
          reflection,
        })
      )
    }
  }
}

function groupStandaloneByKind(
  standaloneItems: DeclarationReflection[]
): Map<ReflectionKind, DeclarationReflection[]> {
  const itemsByKind = new Map<ReflectionKind, DeclarationReflection[]>()

  for (const item of standaloneItems) {
    const existing = itemsByKind.get(item.kind) ?? []
    existing.push(item)
    itemsByKind.set(item.kind, existing)
  }

  return itemsByKind
}

function getNavigation(sortedItems: DeclarationReflection[], index: number): ReflectionNavigation {
  return {
    next: index < sortedItems.length - 1 ? sortedItems[index + 1] : null,
    prev: index > 0 ? sortedItems[index - 1] : null,
  }
}
