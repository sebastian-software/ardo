import type { DeclarationReflection } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import { renderSignature } from "./generator-render"
import {
  getModuleNameFromPath,
  getSlug,
  getSourceUrl,
  renderComment,
  sortReflectionsByName,
} from "./generator-shared"

export function generateGroupedFunctionsPage(params: {
  context: TypeDocRuntimeContext
  functions: DeclarationReflection[]
  sourceFile: string
}): GeneratedApiDoc {
  const { context, functions, sourceFile } = params
  const moduleName = getModuleNameFromPath(sourceFile, context.packageNameCache)
  const content = createGroupedFunctionsContent({
    context,
    functions,
    moduleName,
    sourceFile,
  })

  return {
    content,
    frontmatter: {
      description: `Functions from ${sourceFile}`,
      title: `${moduleName} Functions`,
    },
    path: `functions/${getSlug(moduleName)}.md`,
  }
}

function createGroupedFunctionsContent(params: {
  context: TypeDocRuntimeContext
  functions: DeclarationReflection[]
  moduleName: string
  sourceFile: string
}): string {
  const { context, functions, moduleName, sourceFile } = params
  const lines: string[] = [
    `# ${moduleName} Functions`,
    "",
    `Functions exported from \`${sourceFile}\``,
    "",
  ]
  const sortedFunctions = sortReflectionsByName(functions)

  for (const fn of sortedFunctions) {
    appendGroupedFunction(lines, context, fn)
  }

  return lines.join("\n")
}

function appendGroupedFunction(
  lines: string[],
  context: TypeDocRuntimeContext,
  fn: DeclarationReflection
): void {
  lines.push(`## ${fn.name}`)
  lines.push("")

  const summary = fn.comment?.summary
  if (summary != null) {
    lines.push(renderComment(summary))
    lines.push("")
  }

  const signatures = fn.signatures ?? []
  for (const signature of signatures) {
    lines.push(renderSignature(context, signature))
    lines.push("")
  }

  appendExamples(lines, fn)
  appendSourceLink(lines, context, fn)
  lines.push("---")
  lines.push("")
}

function appendExamples(lines: string[], reflection: DeclarationReflection): void {
  const tags = reflection.comment?.blockTags ?? []
  const examples = tags.filter((tag) => tag.tag === "@example")
  if (examples.length === 0) {
    return
  }

  lines.push("### Example")
  lines.push("")

  for (const example of examples) {
    lines.push(renderComment(example.content))
    lines.push("")
  }
}

function appendSourceLink(
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

  const sourceUrl = getSourceUrl(
    context.config.markdown.sourceBaseUrl,
    source.fileName,
    source.line
  )
  if (sourceUrl == null) {
    return
  }

  lines.push(`[Source](${sourceUrl})`)
  lines.push("")
}

export function generateGroupedTypesPage(params: {
  context: TypeDocRuntimeContext
  sourceFile: string
  types: DeclarationReflection[]
}): GeneratedApiDoc {
  const { context, sourceFile, types } = params
  const moduleName = getModuleNameFromPath(sourceFile, context.packageNameCache)
  const content = createGroupedTypesContent({
    context,
    moduleName,
    sourceFile,
    types,
  })

  return {
    content,
    frontmatter: {
      description: `Type definitions from ${sourceFile}`,
      title: `${moduleName} Types`,
    },
    path: `types/${getSlug(moduleName)}.md`,
  }
}

function createGroupedTypesContent(params: {
  context: TypeDocRuntimeContext
  moduleName: string
  sourceFile: string
  types: DeclarationReflection[]
}): string {
  const { context, moduleName, sourceFile, types } = params
  const lines: string[] = [
    `# ${moduleName} Types`,
    "",
    `Type definitions from \`${sourceFile}\``,
    "",
  ]
  const sortedTypes = sortReflectionsByName(types)

  for (const typeAlias of sortedTypes) {
    appendGroupedType(lines, context, typeAlias)
  }

  return lines.join("\n")
}

function appendGroupedType(
  lines: string[],
  context: TypeDocRuntimeContext,
  typeAlias: DeclarationReflection
): void {
  lines.push(`## ${typeAlias.name}`)
  lines.push("")

  const summary = typeAlias.comment?.summary
  if (summary != null) {
    lines.push(renderComment(summary))
    lines.push("")
  }

  if (typeAlias.type != null) {
    lines.push("```typescript")
    lines.push(`type ${typeAlias.name} = ${typeAlias.type.toString()}`)
    lines.push("```")
    lines.push("")
  }

  appendSourceLink(lines, context, typeAlias)
  lines.push("---")
  lines.push("")
}
