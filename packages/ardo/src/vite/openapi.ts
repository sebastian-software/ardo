import fs from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"

import type { OpenApiConfig } from "../config/types"

import { type GeneratedDoc, writeGeneratedDocs } from "../generated-docs"
import { prepareNativeMarkdown } from "../markdown/native-metadata"

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
  const spec = new SpecText()
  const title = document.info?.title ?? "API Reference"
  const groups = new Map<string, CollectedOperation[]>()
  for (const operation of operations)
    groups.set(operation.tag, [...(groups.get(operation.tag) ?? []), operation])
  return spec.finish(
    `# ${spec.text(title)}\n\n${spec.text(document.info?.description ?? "")}\n\n${[...groups].map(([tag, items]) => `## ${tag}\n\n${items.map((item) => `- [${inlineCode(`${item.method} ${item.path}`)}](./${tag}/${item.slug})`).join("\n")}`).join("\n\n")}\n`
  )
}

function renderOperation(operation: CollectedOperation): string {
  const spec = new SpecText()
  const parametersList = operation.parameters ?? []
  const parameters =
    parametersList.length > 0
      ? `## Parameters\n\n${parametersList.map((parameter) => `- ${inlineCode(parameter.name ?? "")} (${spec.text(parameter.in ?? "")}${parameter.required ? ", required" : ""}): ${spec.text(parameter.description ?? "")}`).join("\n")}\n`
      : ""
  const responses =
    operation.responses == null
      ? ""
      : `## Responses\n\n${Object.entries(operation.responses)
          .map(
            ([status, response]) =>
              `- ${inlineCode(status)}: ${spec.text(response.description ?? "")}`
          )
          .join("\n")}\n`
  return spec.finish(
    `# ${spec.text(`${operation.method} ${operation.path}`)}\n\n${spec.text(operation.summary ?? operation.description ?? "")}\n\n${parameters}\n${responses}`
  )
}

const firstMarker = 0xf_00_00
const markerPattern = /[\u{F0000}-\u{FFFFD}]/gu
const specialPattern = /[{}<\u{F0000}-\u{FFFFD}]/gu

/**
 * Spec text is CommonMark, but the pages are MDX, where `{`, `}` and `<` start
 * expressions and JSX. Every such character in spec text first becomes a
 * unique marker; Ferromark then parses the finished page, and only the markers
 * outside code get a backslash. Code stays byte-identical, prose renders
 * literally with its Markdown formatting, and raw HTML in the spec shows as text.
 */
class SpecText {
  private readonly characters: Array<{ literal: boolean; value: string }> = []

  text(value: string): string {
    return value.replaceAll(specialPattern, (character, offset: number) => {
      let backslashes = 0
      while (value[offset - backslashes - 1] === "\\") backslashes += 1
      // A marker-range character in the spec is kept as it is.
      const literal = backslashes % 2 === 1 || markerIndex(character) >= 0
      this.characters.push({ literal, value: character })
      return String.fromCodePoint(firstMarker + this.characters.length - 1)
    })
  }

  finish(page: string): string {
    const code = this.markersInCode(page)
    return page.replaceAll(markerPattern, (marker) => {
      const index = markerIndex(marker)
      const character = this.characters[index]
      if (character == null) return marker
      return code.has(index) || character.literal ? character.value : `\\${character.value}`
    })
  }

  private markersInCode(page: string): Set<number> {
    const code: string[] = []
    const { prepared, renderOptions } = prepareNativeMarkdown(page, "mdx")
    const result = prepared.render(renderOptions, (block, language, meta) => {
      code.push(block, language ?? "", meta ?? "")
      return "<pre />"
    })
    // Inline code renders as a `<code>` element holding only its text.
    for (const match of result.body.matchAll(/<code>([\s\S]*?)<\/code>/gu))
      code.push(match[1] ?? "")
    return new Set(
      code.flatMap((text) =>
        [...text.matchAll(markerPattern)].map((match) => markerIndex(match[0]))
      )
    )
  }
}

/** The marker's index; negative for characters below the marker range. */
function markerIndex(character: string): number {
  return (character.codePointAt(0) ?? 0) - firstMarker
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
