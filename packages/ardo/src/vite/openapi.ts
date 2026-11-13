import fs from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"

import type { OpenApiConfig } from "../config/types"

import { type GeneratedDoc, writeGeneratedDocs } from "../generated-docs"

type OpenApiDocument = {
  info?: { description?: string; title?: string; version?: string }
  openapi?: string
  paths?: Record<string, Record<string, Operation>>
}

type Operation = {
  description?: string
  operationId?: string
  parameters?: Array<{ description?: string; in?: string; name?: string; required?: boolean }>
  responses?: Record<string, { description?: string }>
  summary?: string
  tags?: string[]
}

type CollectedOperation = { method: string; path: string; slug: string; tag: string } & Operation

const httpMethods = new Set(["delete", "get", "head", "options", "patch", "post", "put"])

export async function generateOpenApiDocs(input: {
  config: OpenApiConfig
  /** Rewrite only changed pages, for regeneration while the dev server watches them. */
  incremental?: boolean
  root: string
  routesDir: string
}): Promise<number> {
  const config = { out: "api", ...input.config }
  const document = await readOpenApiDocument(path.resolve(input.root, config.spec))
  if (!document.openapi?.startsWith("3.")) {
    throw new Error("[ardo] openapi.spec must contain an OpenAPI 3.0 or 3.1 document.")
  }

  const operations = collectOperations(document)
  const docs: GeneratedDoc[] = [
    {
      content: renderIndex(document, operations),
      frontmatter: { contentWidth: "page", title: document.info?.title ?? "API Reference" },
      path: "index.mdx",
    },
    ...operations.map((operation): GeneratedDoc => ({
      content: renderOperation(operation),
      frontmatter: { contentWidth: "page", title: `${operation.method} ${operation.path}` },
      path: `${operation.tag}/${operation.slug}.mdx`,
    })),
  ]
  await writeGeneratedDocs(
    {
      configKey: "openapi.out",
      incremental: input.incremental,
      out: config.out,
      outputDir: input.routesDir,
    },
    docs
  )
  return docs.length
}

async function readOpenApiDocument(filePath: string): Promise<OpenApiDocument> {
  const source = await fs.readFile(filePath, "utf8")
  const value: unknown = filePath.endsWith(".json") ? JSON.parse(source) : parse(source)
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new Error("[ardo] openapi.spec must contain an object document.")
  }
  return value
}

function collectOperations(document: OpenApiDocument): CollectedOperation[] {
  const operations: CollectedOperation[] = []
  for (const [routePath, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method.toLowerCase())) continue
      const tag = operation.tags?.[0] ?? "endpoints"
      operations.push({
        ...operation,
        method: method.toUpperCase(),
        path: routePath,
        slug: slugify(operation.operationId ?? `${method}-${routePath}`),
        tag: slugify(tag),
      })
    }
  }
  disambiguateSlugs(operations)
  // Code-unit order keeps the output independent of the build machine's locale.
  return operations.sort((left, right) => compareCodeUnits(pageKey(left), pageKey(right)))
}

/**
 * Different operations can share a slug, such as `GET /pets/{petId}` and
 * `GET /pets/petId`. The first one in spec order keeps it, and later ones get
 * the next free numeric suffix, so every operation keeps its own page.
 */
function disambiguateSlugs(operations: CollectedOperation[]): void {
  const taken = new Set(operations.map((operation) => pageKey(operation)))
  const assigned = new Set<string>()
  for (const operation of operations) {
    if (assigned.has(pageKey(operation))) {
      const base = operation.slug
      let suffix = 2
      do operation.slug = `${base}-${suffix++}`
      while (taken.has(pageKey(operation)))
      taken.add(pageKey(operation))
    }
    assigned.add(pageKey(operation))
  }
}

function pageKey(operation: CollectedOperation): string {
  return `${operation.tag}/${operation.slug}`
}

function compareCodeUnits(left: string, right: string): number {
  if (left === right) return 0
  return left < right ? -1 : 1
}

function renderIndex(document: OpenApiDocument, operations: CollectedOperation[]): string {
  const title = document.info?.title ?? "API Reference"
  const groups = new Map<string, CollectedOperation[]>()
  for (const operation of operations)
    groups.set(operation.tag, [...(groups.get(operation.tag) ?? []), operation])
  return `# ${escapeMdx(title)}\n\n${escapeMdx(document.info?.description ?? "")}\n\n${[...groups].map(([tag, items]) => `## ${tag}\n\n${items.map((item) => `- [${inlineCode(`${item.method} ${item.path}`)}](./${tag}/${item.slug})`).join("\n")}`).join("\n\n")}\n`
}

function renderOperation(operation: CollectedOperation): string {
  const parametersList = operation.parameters ?? []
  const parameters =
    parametersList.length > 0
      ? `## Parameters\n\n${parametersList.map((parameter) => `- ${inlineCode(parameter.name ?? "")} (${escapeMdx(parameter.in ?? "")}${parameter.required ? ", required" : ""}): ${escapeMdx(parameter.description ?? "")}`).join("\n")}\n`
      : ""
  const responses =
    operation.responses == null
      ? ""
      : `## Responses\n\n${Object.entries(operation.responses)
          .map(
            ([status, response]) =>
              `- ${inlineCode(status)}: ${escapeMdx(response.description ?? "")}`
          )
          .join("\n")}\n`
  return `# ${escapeMdx(`${operation.method} ${operation.path}`)}\n\n${escapeMdx(operation.summary ?? operation.description ?? "")}\n\n${parameters}\n${responses}`
}

const fencePattern = /^[ \t]*(`{3,}|~{3,})/u

/**
 * Spec text is CommonMark, but the pages are MDX, where `{`, `}` and `<` start
 * expressions and JSX. Escaping them outside code renders the text literally
 * and keeps its Markdown formatting; raw HTML in the spec shows as text.
 */
function escapeMdx(value: string): string {
  let result = ""
  let prose = ""
  let fence: string | undefined
  for (const line of value.split(/(?<=\n)/u)) {
    const marker = fencePattern.exec(line)?.[1]
    if (fence == null && marker == null) {
      prose += line
      continue
    }
    if (fence == null) {
      result += escapeInline(prose)
      prose = ""
      fence = marker
    } else if (marker?.[0] === fence[0] && marker.length >= fence.length) fence = undefined
    result += line
  }
  result += escapeInline(prose)
  // An unclosed fence would otherwise swallow the rest of the generated page.
  return fence == null ? result : `${result}\n${fence}`
}

function escapeInline(text: string): string {
  let result = ""
  let index = 0
  while (index < text.length) {
    const char = text[index] ?? ""
    if (char === "\\" && /[!-/:-@[-`{-~]/u.test(text[index + 1] ?? "")) {
      result += text.slice(index, index + 2)
      index += 2
    } else if (char === "`") {
      const run = /^`+/u.exec(text.slice(index))?.[0] ?? char
      const close = findClosingBackticks(text, index + run.length, run.length)
      const end = close == null ? index + run.length : close + run.length
      result += text.slice(index, end)
      index = end
    } else {
      result += char === "{" || char === "}" || char === "<" ? `\\${char}` : char
      index += 1
    }
  }
  return result
}

function findClosingBackticks(text: string, from: number, length: number): number | undefined {
  const pattern = /`+/gu
  pattern.lastIndex = from
  for (let match = pattern.exec(text); match != null; match = pattern.exec(text)) {
    if (match[0].length === length) return match.index
  }
  return undefined
}

function inlineCode(value: string): string {
  const longestRun = Math.max(0, ...[...value.matchAll(/`+/gu)].map((match) => match[0].length))
  const delimiter = "`".repeat(longestRun + 1)
  const padding = value.startsWith("`") || value.endsWith("`") ? " " : ""
  return `${delimiter}${padding}${value}${padding}${delimiter}`
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/gu, "-")
      .replaceAll(/^-|-$/gu, "") || "endpoint"
  )
}
