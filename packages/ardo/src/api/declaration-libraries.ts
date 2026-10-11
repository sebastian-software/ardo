import type { Comment } from "oxc-parser"

import path from "node:path"

import type {
  DeclarationModule,
  DeclarationReader,
  ResolvedDeclaration,
} from "./declaration-project"

export type DeclarationReference = { kind: "lib" | "path" | "types"; value: string }
type LibraryReader = Pick<DeclarationReader, "read" | "report">

/** Supplied scripts, explicit global augmentations, and header references contribute globals. */
export class DeclarationLibraries {
  private readonly files = new Set<string>()
  private readonly declarations = new Map<string, ResolvedDeclaration>()

  has(module: DeclarationModule): boolean {
    return this.files.has(module.file)
  }

  resolve(name: string): ResolvedDeclaration | undefined {
    return this.declarations.get(name)
  }

  async load(files: string[], reader: LibraryReader): Promise<void> {
    for (const file of files) await this.loadFile(file, reader)
  }

  private async loadFile(file: string, reader: LibraryReader): Promise<void> {
    const module = await reader.read(file)
    if (this.files.has(module.file)) return
    if (module.isExternalModule && module.globalDeclarations.size === 0)
      throw new Error(`[ardo] Expected global declarations in the supplied library: ${module.file}`)
    this.files.add(module.file)
    for (const reference of module.references) {
      const dependency = referencedFile(reference, module, reader)
      if (dependency != null) await this.loadFile(dependency, reader)
    }
    this.index(module)
  }

  private index(module: DeclarationModule): void {
    const globals = module.isExternalModule ? module.globalDeclarations : module.declarations
    for (const [name, records] of globals) {
      // Constructor variables such as `declare var Error` describe the static
      // side. Inheritance needs the instance interface, including augmentations.
      const types = records.filter((record) =>
        ["TSInterfaceDeclaration", "TSTypeAliasDeclaration", "ClassDeclaration"].includes(
          record.node.type
        )
      )
      if (types.length === 0) continue
      const existing = this.declarations.get(name)
      if (existing == null)
        this.declarations.set(name, { module: types[0].module, name, records: types })
      else existing.records.push(...types)
    }
  }
}

function referencedFile(
  reference: DeclarationReference,
  module: DeclarationModule,
  reader: LibraryReader
): string | undefined {
  if (reference.kind === "types") {
    reader.report(
      module,
      `Ambient types reference ${JSON.stringify(reference.value)} is not supported.`
    )
    return undefined
  }
  if (reference.kind === "path") return path.resolve(path.dirname(module.file), reference.value)
  if (!reference.value.split(".").every((part) => /^\w+$/u.test(part)))
    throw new Error(`[ardo] Invalid compiler lib reference: ${JSON.stringify(reference.value)}`)
  return path.join(path.dirname(module.file), `lib.${reference.value.toLowerCase()}.d.ts`)
}

export function readDeclarationReferences(
  source: string,
  comments: Comment[],
  firstStatement: number
): DeclarationReference[] {
  const references: DeclarationReference[] = []
  for (const comment of comments) {
    if (comment.type !== "Line" || comment.end > firstStatement) continue
    const directive = /^\/\/\/\s*<reference\b([^>]*)\/>\s*$/u.exec(
      source.slice(comment.start, comment.end)
    )
    if (directive == null) continue
    references.push(...readReferenceAttributes(directive[1]))
  }
  return references
}

function readReferenceAttributes(value: string): DeclarationReference[] {
  const references: DeclarationReference[] = []
  const attributes = value.matchAll(/\b(lib|path|types)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu)
  for (const attribute of attributes) {
    const kind = attribute[1]
    if (kind !== "lib" && kind !== "path" && kind !== "types") continue
    references.push({ kind, value: attribute.at(2) ?? attribute[3] })
  }
  return references
}
