import type {
  ApiComment,
  ApiDeclaration,
  ApiProperty,
  ApiSignature,
  DeclarationDocsResult,
} from "./types"

import { getTag } from "./comments"
import { renderIndex } from "./renderer-index"
import {
  codeBlock,
  displayCode,
  escapeTags,
  inlineCode,
  type Links,
  memberTable,
  typeCode,
} from "./renderer-markdown"

/** Sections directly under the page title are `##`; under a signature or method, `###`. */
type SectionHeading = "##" | "###"

/** A JSX usage line longer than this breaks its props onto separate lines. */
const USAGE_LINE_LENGTH = 80

export function renderDeclarationDocs(
  items: ApiDeclaration[],
  out: string,
  title: string
): DeclarationDocsResult["pages"] {
  const folded = foldedPropsTypes(items)
  const pageItems = items.filter((item) => !folded.has(item))
  const { paths, links } = registerPages(pageItems, out)
  for (const [propsType, component] of folded) {
    const page = links.get(component.name)
    if (page != null && !links.has(propsType.name)) links.set(propsType.name, `${page}#props`)
  }
  const pages = pageItems.map((item) => renderPage(item, { path: paths.get(item) ?? "", links }))
  return [renderIndex(pageItems, { paths, out, title }), ...pages]
}

/** A unique page path per declaration, and the URL of each name. */
function registerPages(
  items: ApiDeclaration[],
  out: string
): { paths: Map<ApiDeclaration, string>; links: Links } {
  const used = new Set<string>()
  const paths = new Map<ApiDeclaration, string>()
  const links: Links = new Map()
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
  return { paths, links }
}

/**
 * `ButtonProps` adds nothing to the page of `Button` when that page already
 * lists every prop. Such props types get no page of their own; links to them
 * lead to the component's props.
 */
function foldedPropsTypes(items: ApiDeclaration[]): Map<ApiDeclaration, ApiDeclaration> {
  const components = new Map(
    items.filter((item) => item.kind === "component").map((item) => [item.name, item])
  )
  const folded = new Map<ApiDeclaration, ApiDeclaration>()
  for (const item of items) {
    if ((item.kind !== "type" && item.kind !== "interface") || !item.name.endsWith("Props"))
      continue
    const component = components.get(item.name.slice(0, -"Props".length))
    if (component == null || !component.propertiesComplete) continue
    if (component.signatures.at(0)?.parameters.at(0)?.type !== item.name) continue
    folded.set(item, component)
  }
  return folded
}

function renderPage(
  item: ApiDeclaration,
  options: { path: string; links: Links }
): DeclarationDocsResult["pages"][number] {
  const lines =
    item.kind === "component"
      ? renderComponent(item, options.links)
      : renderDeclaration(item, options.links)
  return { path: options.path, content: lines.join("\n"), frontmatter: { title: item.name } }
}

/**
 * A component reads like React: how to import and write it, then its props.
 * Its function signature and return type say nothing a reader needs.
 */
function renderComponent(item: ApiDeclaration, links: Links): string[] {
  const properties = item.properties.filter((property) => property.kind === "property")
  const lines = [
    `# ${item.name}`,
    "",
    ...renderDescription(item.comment, links),
    codeBlock(withImport(item, componentUsage(item.name, properties)), "tsx"),
    "",
  ]
  if (properties.length > 0) lines.push("## Props", "", ...propertyTable(properties, links), "")
  const propsType = item.signatures.at(0)?.parameters.at(0)?.type
  const ownPage = links.get(item.name)
  if (propsType != null && propsType !== "")
    lines.push(
      // A props type folded into this page links back to it; name it plainly instead.
      `Props type: ${links.get(propsType) === `${ownPage}#props` ? inlineCode(propsType) : typeCode(propsType, links)}`,
      ""
    )
  else if (item.signatures.length > 0 && properties.length === 0)
    lines.push("This component takes no props.", "")
  if (!item.propertiesComplete)
    lines.push(
      "> Additional members may be defined by the props type above; this table shows the members that could be expanded.",
      ""
    )
  lines.push(...renderExamples(item.comment, "##"))
  return lines
}

function renderDeclaration(item: ApiDeclaration, links: Links): string[] {
  const lines = [
    `# ${item.name}`,
    "",
    ...renderDescription(item.comment, links),
    codeBlock(withImport(item, displayCode(item.signature))),
    "",
  ]
  appendCallSignatures(lines, item, links)
  const properties = item.properties.filter((property) => property.kind === "property")
  if (properties.length > 0)
    lines.push("## Properties", "", ...propertyTable(properties, links), "")
  if (!item.propertiesComplete)
    lines.push(
      "> Additional members may be defined by the type expression above; this table shows the members that could be expanded.",
      ""
    )
  appendIndexSignatures(lines, item, links)
  appendMethods(lines, item, links)
  lines.push(...renderExamples(item.comment, "##"))
  return lines
}

/** `<Name required={…}>{children}</Name>`, with only the props a reader must pass. */
function componentUsage(name: string, properties: ApiProperty[]): string {
  const required = properties
    .filter((property) => !property.optional && property.name !== "children")
    .map((property) => `${property.name}={…}`)
  const hasChildren = properties.some((property) => property.name === "children")
  const close = hasChildren ? `>{children}</${name}>` : " />"
  const inline = `<${[name, ...required].join(" ")}${close}`
  if (inline.length <= USAGE_LINE_LENGTH || required.length === 0) return inline
  const props = required.map((prop) => `  ${prop}`).join("\n")
  return hasChildren ? `<${name}\n${props}\n>\n  {children}\n</${name}>` : `<${name}\n${props}\n/>`
}

function withImport(item: ApiDeclaration, code: string): string {
  if (item.importPath == null) return code
  const typeOnly = item.kind === "type" || item.kind === "interface"
  const statement = `import ${typeOnly ? "type " : ""}{ ${item.name} } from "${item.importPath}"`
  return `${statement}\n\n${code}`
}

function appendCallSignatures(lines: string[], item: ApiDeclaration, links: Links): void {
  const typeCall = item.kind === "type" || item.kind === "interface"
  // A single function signature has no heading of its own, so its sections sit under the title.
  const nested = item.signatures.length > 1 || typeCall
  const heading: SectionHeading = nested ? "###" : "##"
  for (const signature of item.signatures) {
    if (item.signatures.length > 1) lines.push("## Overload", "")
    else if (typeCall) lines.push("## Call signature", "")
    if (signature.comment.description !== item.comment.description)
      lines.push(...renderComment(signature.comment, links, heading))
    if (nested) lines.push(codeBlock(displayCode(signature.text)), "")
    lines.push(...renderSignature(signature, links, heading))
  }
}

function appendIndexSignatures(lines: string[], item: ApiDeclaration, links: Links): void {
  const indexes = item.properties.filter((property) => property.kind === "index")
  if (indexes.length === 0) return
  lines.push("## Index signatures", "")
  for (const index of indexes)
    lines.push(
      ...renderComment(index.comment, links, "###"),
      codeBlock(displayCode(`${index.readonly ? "readonly " : ""}${index.name}: ${index.type};`)),
      ""
    )
}

function appendMethods(lines: string[], item: ApiDeclaration, links: Links): void {
  for (const method of item.properties.filter(
    (property) => property.kind === "method" || property.kind === "constructor"
  )) {
    lines.push(`## ${method.name}`, "", ...renderComment(method.comment, links, "###"))
    for (const signature of method.signatures)
      lines.push(
        codeBlock(displayCode(signature.text)),
        "",
        ...renderSignature(signature, links, "###")
      )
  }
}

/** Deprecation note, description, and remarks. */
function renderDescription(comment: ApiComment, links: Links): string[] {
  const lines: string[] = []
  const deprecated = getTag(comment, "deprecated")
  if (deprecated != null) lines.push(`> **Deprecated.** ${renderLinks(deprecated, links)}`, "")
  if (comment.description !== "") lines.push(renderLinks(comment.description, links), "")
  const remarks = getTag(comment, "remarks")
  if (remarks != null) lines.push(renderLinks(remarks, links), "")
  return lines
}

function renderExamples(comment: ApiComment, heading: SectionHeading): string[] {
  const lines: string[] = []
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

function renderComment(comment: ApiComment, links: Links, heading: SectionHeading): string[] {
  return [...renderDescription(comment, links), ...renderExamples(comment, heading)]
}

function renderSignature(signature: ApiSignature, links: Links, heading: SectionHeading): string[] {
  const lines: string[] = []
  if (signature.parameters.length > 0) {
    const rows = signature.parameters.map((parameter) => [
      inlineCode(`${parameter.rest ? "..." : ""}${parameter.name}`),
      typeCode(parameter.type, links),
      parameter.optional || parameter.rest ? "No" : "Yes",
      renderLinks(parameter.description, links),
    ])
    lines.push(`${heading} Parameters`, "", ...memberTable(rows), "")
  }
  if (signature.returnType !== "")
    lines.push(
      `${heading} Returns`,
      "",
      typeCode(signature.returnType, links),
      "",
      renderLinks(
        getTag(signature.comment, "returns") ?? getTag(signature.comment, "return") ?? "",
        links
      ),
      ""
    )
  return lines
}

function propertyTable(properties: ApiProperty[], links: Links): string[] {
  return memberTable(
    properties.map((property) => [
      inlineCode(property.name),
      typeCode(property.type, links),
      property.optional ? "No" : "Yes",
      renderLinks(propertyDescription(property), links),
    ])
  )
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

function renderLinks(text: string, links: Links): string {
  return escapeTags(text).replaceAll(
    /\{@link(?:code|plain)?\b([^}]+)\}/gu,
    (_match, body: string) => {
      const value = body.trim()
      const separator = value.search(/[|\s]/u)
      const target = separator < 0 ? value : value.slice(0, separator)
      const label = separator < 0 ? target : value.slice(separator).replace(/^[|\s]+/u, "")
      const url = links.get(target) ?? (/^https?:\/\//u.test(target) ? target : undefined)
      return url == null ? inlineCode(label || target) : `[${label || target}](${url})`
    }
  )
}
