import type { DeclarationReflection } from "typedoc"

import { renderComment } from "./generator-shared"

export function appendReflectionCommentTags(
  lines: string[],
  reflection: DeclarationReflection
): void {
  const blockTags = reflection.comment?.blockTags ?? []

  appendTagExamples(lines, blockTags)
  appendTagDeprecated(lines, blockTags)
  appendTagSeeAlso(lines, blockTags)
}

function appendTagExamples(
  lines: string[],
  blockTags: NonNullable<DeclarationReflection["comment"]>["blockTags"]
): void {
  const examples = blockTags.filter((tag) => tag.tag === "@example")
  if (examples.length === 0) {
    return
  }

  lines.push("## Examples")
  lines.push("")

  for (const example of examples) {
    lines.push(renderComment(example.content))
    lines.push("")
  }
}

function appendTagDeprecated(
  lines: string[],
  blockTags: NonNullable<DeclarationReflection["comment"]>["blockTags"]
): void {
  const deprecatedTag = blockTags.find((tag) => tag.tag === "@deprecated")
  if (deprecatedTag == null) {
    return
  }

  lines.push('<Warning title="Deprecated">')
  lines.push(renderComment(deprecatedTag.content))
  lines.push("</Warning>")
  lines.push("")
}

function appendTagSeeAlso(
  lines: string[],
  blockTags: NonNullable<DeclarationReflection["comment"]>["blockTags"]
): void {
  const seeTags = blockTags.filter((tag) => tag.tag === "@see")
  if (seeTags.length === 0) {
    return
  }

  lines.push("## See Also")
  lines.push("")
  for (const seeTag of seeTags) {
    lines.push(`- ${renderComment(seeTag.content)}`)
  }
  lines.push("")
}
