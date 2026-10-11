import type { Comment } from "oxc-parser"

import type { ApiComment } from "./types"

const inlineTags = new Set([
  "param",
  "return",
  "returns",
  "defaultValue",
  "default",
  "deprecated",
  "example",
  "remarks",
  "internal",
  "private",
  "public",
])

export function readComment(source: string, comments: Comment[], start: number): ApiComment {
  let cursor = start
  // OXC returns comments in source order. Start at the last preceding comment
  // instead of copying and scanning the entire file's comments for every member.
  let low = 0
  let high = comments.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (comments[middle].end <= start) low = middle + 1
    else high = middle
  }
  for (let index = low - 1; index >= 0; index--) {
    const comment = comments[index]
    if (source.slice(comment.end, cursor).trim() !== "") break
    if (comment.type === "Block" && comment.value.startsWith("*"))
      return parseComment(comment.value.slice(1))
    cursor = comment.start
  }
  return { description: "", tags: [] }
}

function parseComment(value: string): ApiComment {
  const lines = value.split(/\r?\n/u).map((line) => line.replace(/^\s*\* ?/u, ""))
  const description: string[] = []
  const tags: ApiComment["tags"] = []
  let fenced = false
  for (const line of lines) {
    const delimiter = /^\s*(?:```|~~~)/u.test(line)
    const parts = fenced || delimiter ? [line] : splitInlineTags(line)
    for (const part of parts) appendCommentLine(part, { description, tags, fenced })
    if (delimiter) fenced = !fenced
  }
  return {
    description: description.join("\n").trim(),
    tags: tags.map((tag) => ({ ...tag, text: tag.text.trim() })),
  }
}

function appendCommentLine(
  line: string,
  state: { description: string[]; tags: ApiComment["tags"]; fenced: boolean }
): void {
  const match = state.fenced ? null : /^\s*@(\w+)\b/u.exec(line)
  if (match != null)
    state.tags.push({ name: match[1], text: line.slice(match[0].length).trimStart() })
  else {
    const tag = state.tags.at(-1)
    if (tag == null) state.description.push(line)
    else tag.text += `\n${line}`
  }
}

function splitInlineTags(line: string): string[] {
  const positions = [...line.matchAll(/@(\w+)\b/gu)]
    .filter(
      (match) => match.index > 0 && /\s/u.test(line[match.index - 1]) && inlineTags.has(match[1])
    )
    .map((match) => match.index)
  const boundaries = [0, ...positions, line.length]
  return boundaries
    .slice(0, -1)
    .map((start, index) => line.slice(start, boundaries[index + 1]).trimEnd())
}

export function getTag(comment: ApiComment, name: string): string | undefined {
  return comment.tags.find((tag) => tag.name === name)?.text
}

export function isInternal(comment: ApiComment): boolean {
  return comment.tags.some((tag) => tag.name === "internal" || tag.name === "private")
}

export function getParameterDescription(comment: ApiComment, name: string): string {
  for (const tag of comment.tags.filter((item) => item.name === "param")) {
    const text = tag.text.replace(/^\{[^}]*\}/u, "").trimStart()
    const parameter = /^\S+/u.exec(text)?.[0] ?? ""
    const normalized = parameter.replaceAll(/^\[|\]$/gu, "").split("=")[0]
    if (normalized === name) return text.slice(parameter.length).trimStart().replace(/^-\s*/u, "")
  }
  return ""
}
