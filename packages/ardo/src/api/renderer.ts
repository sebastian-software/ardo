import type {
  ApiComment,
  ApiDeclaration,
  ApiProperty,
  ApiSignature,
  DeclarationDocsResult,
} from "./types"

import { getTag } from "./comments"

/** Sections directly under the page title are `##`; under a signature or method, `###`. */
type SectionHeading = "##" | "###"

export function renderDeclarationDocs(
  items: ApiDeclaration[],
  out: string,
  title: string
): DeclarationDocsResult["pages"] {
  const used = new Set<string>()
  const paths = new Map<ApiDeclaration, string>()
  const links = new Map<string, string>()
  for (const item of items) {
    const category =
      item.kind === "class" ? "classes" : item.kind === "type" ? "types" : `${item.kind}s`
    const slug =
      item.name
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
        .replaceAll(/^-|-$/gu, "") || "export"
    let file = `${category}/${slug}.md`
    let index = 2
    while (used.has(file)) file = `${category}/${slug}-${index++}.md`
    used.add(file)
    paths.set(item, file)
    if (!links.has(item.name)) links.set(item.name, `/${out}/${file.slice(0, -3)}`)
  }

  const pages = items.map((item) => renderPage(item, { path: paths.get(item) ?? "", links }))
  return [renderIndex(items, { paths, out, title }), ...pages]
}

function renderPage(
  item: ApiDeclaration,
  options: { path: string; links: Map<string, string> }
): DeclarationDocsResult["pages"][number] {
  const { links } = options
  const lines = [
    `# ${item.name}`,
    "",
    ...renderComment(item.comment, links, "##"),
    codeBlock(item.signature),
    "",
  ]
  appendCallSignatures(lines, item, links)
  const properties = item.properties.filter((property) => property.kind === "property")
  if (properties.length > 0)
    lines.push(
      item.kind === "component" ? "## Props" : "## Properties",
      "",
      ...propertyTable(properties, links),
      ""
    )
  if (!item.propertiesComplete)
    lines.push(
      "> Additional members may be defined by the type expression above; this table shows the members that could be expanded.",
      ""
    )
  appendIndexSignatures(lines, item, links)
  appendMethods(lines, item, links)
  return { path: options.path, content: lines.join("\n"), frontmatter: { title: item.name } }
}

function appendCallSignatures(
  lines: string[],
  item: ApiDeclaration,
  links: Map<string, string>
): void {
  const typeCall = item.kind === "type" || item.kind === "interface"
  // A single function signature has no heading of its own, so its sections sit under the title.
  const nested = item.signatures.length > 1 || typeCall
  const heading: SectionHeading = nested ? "###" : "##"
  for (const signature of item.signatures) {
    if (item.signatures.length > 1) lines.push("## Overload", "")
    else if (typeCall) lines.push("## Call signature", "")
    if (signature.comment.description !== item.comment.description)
      lines.push(...renderComment(signature.comment, links, heading))
    if (nested) lines.push(codeBlock(signature.text), "")
    lines.push(...renderSignature(signature, links, heading))
  }
}

function appendIndexSignatures(
  lines: string[],
  item: ApiDeclaration,
  links: Map<string, string>
): void {
  const indexes = item.properties.filter((property) => property.kind === "index")
  if (indexes.length === 0) return
  lines.push("## Index signatures", "")
  for (const index of indexes)
    lines.push(
      ...renderComment(index.comment, links, "###"),
      codeBlock(`${index.readonly ? "readonly " : ""}${index.name}: ${index.type};`),
      ""
    )
}

function appendMethods(lines: string[], item: ApiDeclaration, links: Map<string, string>): void {
  for (const method of item.properties.filter(
    (property) => property.kind === "method" || property.kind === "constructor"
  )) {
    lines.push(`## ${method.name}`, "", ...renderComment(method.comment, links, "###"))
    for (const signature of method.signatures)
      lines.push(codeBlock(signature.text), "", ...renderSignature(signature, links, "###"))
  }
}

function renderIndex(
  items: ApiDeclaration[],
  options: { paths: Map<ApiDeclaration, string>; out: string; title: string }
): DeclarationDocsResult["pages"][number] {
  const lines = [`# ${options.title}`, ""]
  const groups = new Map<string, ApiDeclaration[]>()
  for (const item of items) {
    const label =
      item.kind === "class"
        ? "Classes"
        : item.kind === "type"
          ? "Types"
          : `${item.kind[0].toUpperCase()}${item.kind.slice(1)}s`
    const group = groups.get(label) ?? []
    group.push(item)
    groups.set(label, group)
  }
  for (const [label, group] of groups) {
    lines.push(`## ${label}`, "")
    for (const item of group) {
      const file = options.paths.get(item) ?? ""
      lines.push(`- [${item.name}](/${options.out}/${file.slice(0, -3)})`)
    }
    lines.push("")
  }
  return {
    path: "index.md",
    content: lines.join("\n"),
    frontmatter: { title: options.title, sidebar_position: 0 },
  }
}

function renderComment(
  comment: ApiComment,
  links: Map<string, string>,
  heading: SectionHeading
): string[] {
  const lines: string[] = []
  const deprecated = getTag(comment, "deprecated")
  if (deprecated != null) lines.push(`> **Deprecated.** ${renderLinks(deprecated, links)}`, "")
  if (comment.description !== "") lines.push(renderLinks(comment.description, links), "")
  const remarks = getTag(comment, "remarks")
  if (remarks != null) lines.push(renderLinks(remarks, links), "")
  for (const example of comment.tags.filter((tag) => tag.name === "example")) {
    lines.push(
      `${heading} Example`,
      "",
      example.text.includes("```") || example.text.includes("~~~")
        ? example.text
        : codeBlock(example.text),
      ""
    )
  }
  return lines
}

function renderSignature(
  signature: ApiSignature,
  links: Map<string, string>,
  heading: SectionHeading
): string[] {
  const lines: string[] = []
  if (signature.parameters.length > 0) {
    const rows = signature.parameters.map((parameter) => [
      inlineCode(`${parameter.rest ? "..." : ""}${parameter.name}`),
      inlineCode(parameter.type),
      parameter.optional || parameter.rest ? "No" : "Yes",
      renderLinks(parameter.description, links),
    ])
    lines.push(`${heading} Parameters`, "", ...memberTable(rows), "")
  }
  if (signature.returnType !== "")
    lines.push(
      `${heading} Returns`,
      "",
      inlineCode(signature.returnType),
      "",
      renderLinks(
        getTag(signature.comment, "returns") ?? getTag(signature.comment, "return") ?? "",
        links
      ),
      ""
    )
  return lines
}

function propertyTable(properties: ApiProperty[], links: Map<string, string>): string[] {
  return memberTable(
    properties.map((property) => [
      inlineCode(property.name),
      inlineCode(property.type),
      property.optional ? "No" : "Yes",
      renderLinks(propertyDescription(property), links),
    ])
  )
}

/** Name, type, required and description rows; drops the description column when every cell is empty. */
function memberTable(rows: string[][]): string[] {
  const described = rows.some((row) => row[3] !== "")
  const headers = described
    ? ["Name", "Type", "Required", "Description"]
    : ["Name", "Type", "Required"]
  return [
    tableRow(headers),
    tableRow(headers.map(() => "---")),
    ...rows.map((row) => tableRow(row.slice(0, headers.length).map((value) => cell(value)))),
  ]
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`
}

function propertyDescription(property: ApiProperty): string {
  const defaultValue =
    getTag(property.comment, "defaultValue") ?? getTag(property.comment, "default")
  const deprecated = getTag(property.comment, "deprecated")
  return [
    property.readonly ? "Readonly." : "",
    property.static ? "Static." : "",
    property.comment.description,
    defaultValue == null ? "" : `Default: ${inlineCode(defaultValue)}.`,
    deprecated == null ? "" : `Deprecated: ${deprecated}.`,
  ]
    .filter(Boolean)
    .join(" ")
}

function renderLinks(text: string, links: Map<string, string>): string {
  return text.replaceAll(/\{@link(?:code|plain)?\b([^}]+)\}/gu, (_match, body: string) => {
    const value = body.trim()
    const separator = value.search(/[|\s]/u)
    const target = separator < 0 ? value : value.slice(0, separator)
    const label = separator < 0 ? target : value.slice(separator).replace(/^[|\s]+/u, "")
    const url = links.get(target) ?? (/^https?:\/\//u.test(target) ? target : undefined)
    return url == null ? inlineCode(label || target) : `[${label || target}](${url})`
  })
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll(/\r?\n/gu, "<br />")
}

function inlineCode(value: string): string {
  const fence = "`".repeat(
    Math.max(0, ...[...value.matchAll(/`+/gu)].map((match) => match[0].length)) + 1
  )
  return `${fence} ${value} ${fence}`
}

function codeBlock(value: string): string {
  const fence = "`".repeat(
    Math.max(2, ...[...value.matchAll(/`+/gu)].map((match) => match[0].length)) + 1
  )
  return `${fence}ts\n${value}\n${fence}`
}
