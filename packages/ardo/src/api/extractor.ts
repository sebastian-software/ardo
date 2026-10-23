import type { DeclarationRecord, ResolvedDeclaration } from "./declaration-project"
import type { Properties } from "./members"
import type { TypeContext, TypeValue } from "./source"
import type {
  ApiDeclaration,
  ApiSignature,
  DeclarationExtractionOptions,
  DeclarationProject,
} from "./types"

import { resolveCallables } from "./callables"
import { isInternal } from "./comments"
import { DeclarationReader } from "./declaration-project"
import { TypeProperties } from "./properties"
import { readSignature } from "./signatures"
import { annotationOf, formatType, parameterType } from "./source"

/** Read public declarations without importing TypeDoc or the TypeScript compiler. */
export async function extractDeclarations(
  entryPoints: string[],
  options: DeclarationExtractionOptions = {}
): Promise<DeclarationProject> {
  if (entryPoints.length === 0)
    throw new Error("[ardo] At least one declaration entry point is required.")
  const reader = new DeclarationReader(options)
  await reader.loadLibraries()
  const extractor = new DeclarationExtractor(reader)
  const items: ApiDeclaration[] = []
  const added = new Set<string>()
  for (const [index, entryPoint] of entryPoints.entries()) {
    const entry = { file: entryPoint, importPath: options.importPaths?.[index] }
    items.push(...(await extractEntryPoint(entry, { reader, extractor, added })))
  }
  return { items, diagnostics: reader.diagnostics, files: [...reader.modules.keys()] }
}

async function extractEntryPoint(
  entry: { file: string; importPath?: string },
  state: { reader: DeclarationReader; extractor: DeclarationExtractor; added: Set<string> }
): Promise<ApiDeclaration[]> {
  const items: ApiDeclaration[] = []
  const module = await state.reader.read(entry.file)
  for (const [name, resolved] of await state.reader.exportsOf(module)) {
    // A declaration that several entry points export belongs to the first one.
    const key = `${resolved.module.id}:${resolved.name}:${name}`
    if (state.added.has(key)) continue
    state.added.add(key)
    const item = await state.extractor.extract(name, resolved)
    if (item != null)
      items.push(entry.importPath == null ? item : { ...item, importPath: entry.importPath })
  }
  return items
}

class DeclarationExtractor {
  private readonly properties: TypeProperties
  constructor(private readonly reader: DeclarationReader) {
    this.properties = new TypeProperties(reader)
  }

  async extract(name: string, resolved: ResolvedDeclaration): Promise<ApiDeclaration | undefined> {
    const records = resolved.records.filter((item) => !isInternal(item.comment))
    const record = records.at(0)
    if (record == null) return undefined
    const context: TypeContext = { module: record.module, bindings: new Map() }
    const comment =
      records.find((item) => item.comment.description.length > 0)?.comment ?? record.comment
    const callables = []
    for (const item of records)
      callables.push(...(await resolveCallables(item, context, { reader: this.reader })))
    const signatures = callables.map((item) =>
      readSignature(item.node, item.context, {
        name:
          record.node.type === "TSTypeAliasDeclaration" ||
          record.node.type === "TSInterfaceDeclaration"
            ? ""
            : name,
        comment: item.comment,
      })
    )
    const kind = declarationKind(record.node, name, signatures)
    if (kind == null) {
      this.reader.report(
        resolved.module,
        `Public declaration ${name} (${record.node.type}) is not supported.`
      )
      return undefined
    }
    const properties = await this.itemProperties({ ...resolved, records }, context, kind)
    return {
      name,
      kind,
      signature: declarationSignature(record.node, context, {
        name,
        signatures,
        variableKind: record.variableKind,
      }),
      comment,
      signatures,
      properties: properties.items,
      propertiesComplete: properties.complete,
      source: {
        file: resolved.module.file,
        line: resolved.module.source.slice(0, record.node.start).split("\n").length,
      },
    }
  }

  private async itemProperties(
    resolved: ResolvedDeclaration,
    context: TypeContext,
    kind: ApiDeclaration["kind"]
  ): Promise<Properties> {
    const node = resolved.records.at(0)?.node
    if (node == null) return { items: [], complete: true }
    if (node.type === "TSTypeAliasDeclaration")
      return this.aliasProperties({ ...context, node: node.typeAnnotation })
    if (kind === "class" || kind === "interface")
      return this.properties.declaration(resolved, context)
    if (kind === "component") {
      const callables = await resolveCallables(resolved.records[0], context, {
        reader: this.reader,
      })
      const callable = callables.at(0)
      const parameter = callable?.node.params.at(0)
      const annotation = parameter == null ? undefined : parameterType(parameter)
      if (callable != null && annotation != null)
        return this.properties.of({ ...callable.context, node: annotation })
    }
    return { items: [], complete: true }
  }

  private async aliasProperties(value: TypeValue): Promise<Properties> {
    // A union is already documented by its alternatives in the declaration.
    // Components still request property expansion and report union limitations.
    if (value.node.type === "TSUnionType") return { items: [], complete: true }
    return this.properties.of(value)
  }
}

function declarationKind(
  node: DeclarationRecord["node"],
  name: string,
  signatures: ApiSignature[]
): ApiDeclaration["kind"] | undefined {
  if (node.type === "TSTypeAliasDeclaration") return "type"
  if (node.type === "TSInterfaceDeclaration") return "interface"
  if (signatures.length > 0)
    return /^[A-Z]/u.test(name) && !/(?:Props|Options|Config)$/u.test(name)
      ? "component"
      : "function"
  const kinds = new Map<string, ApiDeclaration["kind"]>([
    ["TSInterfaceDeclaration", "interface"],
    ["ClassDeclaration", "class"],
    ["TSTypeAliasDeclaration", "type"],
    ["VariableDeclarator", "variable"],
    ["TSEnumDeclaration", "enum"],
  ])
  return kinds.get(node.type)
}

function declarationSignature(
  node: DeclarationRecord["node"],
  context: TypeContext,
  metadata: {
    name: string
    signatures: ApiSignature[]
    variableKind?: NonNullable<DeclarationRecord["variableKind"]>
  }
): string {
  if (node.type === "TSTypeAliasDeclaration") return formatType(node, context)
  if (node.type === "TSInterfaceDeclaration" || node.type === "ClassDeclaration")
    return formatType({ start: node.start, end: node.body.start }, context)
      .replace(/^declare\s+/u, "")
      .trim()
  if (metadata.signatures.length > 0) return metadata.signatures.map((item) => item.text).join("\n")
  if (node.type === "VariableDeclarator") {
    return `${metadata.variableKind ?? "const"} ${metadata.name}: ${variableType(node, context)}`
  }
  return formatType(node, context).replace(/^declare\s+/u, "")
}

function variableType(
  node: Extract<DeclarationRecord["node"], { type: "VariableDeclarator" }>,
  context: TypeContext
): string {
  const annotation = annotationOf(node.id)
  if (annotation != null) return formatType(annotation, context)
  const initializer = node.init
  if (
    initializer != null &&
    ((initializer.type === "Literal" && !("regex" in initializer)) ||
      (initializer.type === "UnaryExpression" &&
        initializer.operator === "-" &&
        initializer.argument.type === "Literal" &&
        (typeof initializer.argument.value === "number" || "bigint" in initializer.argument)))
  )
    return formatType(initializer, context)
  return "/* type not declared */"
}
