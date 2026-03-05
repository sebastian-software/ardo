import type { DeclarationReflection } from "typedoc"

import type { TypeDocRuntimeContext } from "./generator-config"
import type { GeneratedApiDoc } from "./types"

import { renderComponentSignature } from "./generator-render-component"
import {
  createNavigationLine,
  getSlug,
  getSourceUrl,
  type ReflectionNavigation,
  renderComment,
  renderCommentShort,
} from "./generator-shared"

export function generateComponentPage(params: {
  component: DeclarationReflection
  context: TypeDocRuntimeContext
  navigation: ReflectionNavigation
}): GeneratedApiDoc {
  const { component, context, navigation } = params
  const slug = getSlug(component.name)
  const content = createComponentContent(context, component, navigation)

  return {
    content,
    frontmatter: {
      description:
        component.comment?.summary == null
          ? `${component.name} component`
          : renderCommentShort(component.comment.summary),
      title: component.name,
    },
    path: `components/${slug}.md`,
  }
}

function createComponentContent(
  context: TypeDocRuntimeContext,
  component: DeclarationReflection,
  navigation: ReflectionNavigation
): string {
  const lines: string[] = [`# ${component.name}`, ""]

  const summary = component.comment?.summary
  if (summary != null) {
    lines.push(renderComment(summary))
    lines.push("")
  }

  appendComponentUsage(lines, context, component)
  appendExamples(lines, component)
  appendSourceLink(lines, context, component)
  appendComponentNavigation({
    component,
    context,
    lines,
    navigation,
  })

  return lines.join("\n")
}

function appendComponentUsage(
  lines: string[],
  context: TypeDocRuntimeContext,
  component: DeclarationReflection
): void {
  const signatures = component.signatures ?? []
  if (signatures.length === 0) {
    return
  }

  lines.push("## Usage")
  lines.push("")

  for (const signature of signatures) {
    lines.push(renderComponentSignature(context, signature, component.name))
    lines.push("")
  }
}

function appendExamples(lines: string[], reflection: DeclarationReflection): void {
  const tags = reflection.comment?.blockTags ?? []
  const examples = tags.filter((tag) => tag.tag === "@example")
  if (examples.length === 0) {
    return
  }

  lines.push("## Example")
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

function appendComponentNavigation(params: {
  component: DeclarationReflection
  context: TypeDocRuntimeContext
  lines: string[]
  navigation: ReflectionNavigation
}): void {
  const { component, context, lines, navigation } = params
  const line = createNavigationLine({
    basePath: context.basePath,
    kind: component.kind,
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
