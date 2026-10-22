import type {
  Comment,
  Declaration,
  TSConstructorType,
  TSFunctionType,
  TSTypeReference,
  VariableDeclaration,
  VariableDeclarator,
} from "oxc-parser"

import fs from "node:fs/promises"
import path from "node:path"

import type { DeclarationReference } from "./declaration-libraries"
import type { ApiComment, ApiExtractionDiagnostic, DeclarationExtractionOptions } from "./types"

import { createDeclarationModule } from "./declaration-index"
import { DeclarationLibraries } from "./declaration-libraries"
import { resolveDeclarationImport } from "./package-declarations"

export type DeclarationRecord = {
  node: Declaration | VariableDeclarator
  comment: ApiComment
  module: DeclarationModule
  variableKind?: VariableDeclaration["kind"]
}

export type DeclarationBinding = {
  name: string
  request?: string
  module?: DeclarationModule
  declaration?: boolean
}

export type DeclarationModule = {
  /** Scope identity is separate from the physical file used by import resolution. */
  id: string
  file: string
  source: string
  comments: Comment[]
  declarations: Map<string, DeclarationRecord[]>
  globalDeclarations: Map<string, DeclarationRecord[]>
  imports: Map<string, DeclarationBinding>
  exports: Map<string, DeclarationBinding>
  namespaces: Map<string, DeclarationModule>
  parent?: DeclarationModule
  namespace?: DeclarationModule
  implicitExports?: boolean
  exportAssignment?: DeclarationBinding
  stars: string[]
  dependencies: Map<string, DeclarationModule>
  typeReferences: TSTypeReference[]
  genericScopes: Array<TSConstructorType | TSFunctionType>
  isExternalModule: boolean
  references: DeclarationReference[]
}

export type ResolvedDeclaration = {
  module: DeclarationModule
  name: string
  records: DeclarationRecord[]
}

type ResolvedSymbol = {
  declaration?: ResolvedDeclaration
  namespace?: DeclarationModule
}

export class DeclarationReader {
  readonly modules = new Map<string, DeclarationModule>()
  readonly diagnostics: ApiExtractionDiagnostic[] = []
  private readonly missingImports = new Set<string>()
  private readonly libraries = new DeclarationLibraries()
  private readonly declarationFiles: Map<string, string>

  constructor(private readonly options: DeclarationExtractionOptions = {}) {
    this.declarationFiles = new Map(
      [...(options.declarationFiles ?? [])].map(([file, source]) => [path.resolve(file), source])
    )
  }

  async loadLibraries(): Promise<void> {
    await this.libraries.load(this.options.libFiles ?? [], this)
  }

  isLibrary(module: DeclarationModule): boolean {
    return module.parent == null && this.libraries.has(module)
  }

  hasImport(module: DeclarationModule, name: string): boolean {
    const head = name.split(".")[0]
    if (module.declarations.has(head) || module.namespaces.has(head)) return false
    if (module.imports.has(head)) return true
    if (module.namespace?.declarations.has(head) || module.namespace?.namespaces.has(head))
      return false
    return (
      module.namespace?.imports.has(head) === true ||
      (module.parent != null && this.hasImport(module.parent, head))
    )
  }

  globalType(name: string): ResolvedDeclaration | undefined {
    return this.libraries.resolve(name)
  }

  async read(file: string): Promise<DeclarationModule> {
    if (!/\.d\.(?:ts|mts|cts)$/u.test(file)) {
      throw new Error(
        `[ardo] Expected a declaration entry point (.d.ts, .d.mts, or .d.cts): ${file}`
      )
    }

    const resolved = path.resolve(file)
    const absolute = this.declarationFiles.has(resolved) ? resolved : await fs.realpath(resolved)
    const existing = this.modules.get(absolute)
    if (existing != null) return existing

    const source = this.declarationFiles.get(absolute) ?? (await fs.readFile(absolute, "utf8"))
    const module = createDeclarationModule(absolute, source, (message) => {
      this.report({ file: absolute }, message)
    })
    this.modules.set(absolute, module)
    return module
  }

  report(module: Pick<DeclarationModule, "file">, message: string): void {
    if (!this.diagnostics.some((item) => item.file === module.file && item.message === message)) {
      this.diagnostics.push({ file: module.file, message })
    }
  }

  async exportsOf(
    module: DeclarationModule,
    seen = new Set<string>()
  ): Promise<Map<string, ResolvedDeclaration>> {
    if (seen.has(module.id)) return new Map()
    const next = new Set(seen).add(module.id)
    const result = await this.explicitExports(module)
    const ambiguous = new Set<string>()
    for (const request of module.stars) {
      const dependency = await this.dependency(module, request)
      if (dependency == null) {
        this.report(module, `Could not expand export * from ${JSON.stringify(request)}.`)
        continue
      }
      this.appendWildcard(module, await this.exportsOf(dependency, next), { result, ambiguous })
    }
    return result
  }

  private async explicitExports(
    module: DeclarationModule
  ): Promise<Map<string, ResolvedDeclaration>> {
    if (module.exportAssignment != null)
      this.report(module, "Documentation pages for export = entry points are not supported.")
    const result = new Map<string, ResolvedDeclaration>()
    for (const [name, binding] of module.exports) {
      const symbol = await this.resolveBinding(module, binding, new Set())
      const declaration = symbol?.declaration
      if (declaration == null) this.report(module, `Could not resolve public export ${name}.`)
      else result.set(name, declaration)
    }
    return result
  }

  private appendWildcard(
    module: DeclarationModule,
    source: Map<string, ResolvedDeclaration>,
    state: { result: Map<string, ResolvedDeclaration>; ambiguous: Set<string> }
  ): void {
    for (const [name, declaration] of source) {
      if (name === "default" || module.exports.has(name) || state.ambiguous.has(name)) continue
      const previous = state.result.get(name)
      if (previous != null && !sameDeclaration(previous, declaration)) {
        state.result.delete(name)
        state.ambiguous.add(name)
        this.report(module, `Ambiguous wildcard export ${name} was omitted.`)
      } else state.result.set(name, declaration)
    }
  }

  async resolve(
    module: DeclarationModule,
    name: string,
    seen = new Set<string>()
  ): Promise<ResolvedDeclaration | undefined> {
    const symbol = await this.resolveSymbol(module, name, seen)
    return symbol?.declaration
  }

  private async resolveSymbol(
    module: DeclarationModule,
    name: string,
    seen: Set<string>
  ): Promise<ResolvedSymbol | undefined> {
    const key = `${module.id}:local:${name}`
    if (seen.has(key)) return undefined
    const next = new Set(seen).add(key)
    const [head, ...members] = name.split(".")
    let symbol = this.localSymbol(module, head)
    const imported = module.imports.get(head) ?? module.namespace?.imports.get(head)
    if (symbol == null && imported != null)
      symbol = await this.resolveBinding(module, imported, next)
    if (symbol == null && imported == null && module.namespace != null)
      symbol = this.localSymbol(module.namespace, head)
    if (symbol == null && imported == null && module.parent != null)
      symbol = await this.resolveSymbol(module.parent, head, next)
    for (const member of members) {
      if (symbol?.namespace == null) return undefined
      symbol = await this.resolveExport(symbol.namespace, member, next)
    }
    return symbol
  }

  private localSymbol(module: DeclarationModule, name: string): ResolvedSymbol | undefined {
    const records = module.declarations.get(name)
    const namespace = module.namespaces.get(name)
    if (records == null && namespace == null) return undefined
    const sharedScope = module.namespace
    const shared = sharedScope?.declarations.get(name)
    const owner =
      records != null && sharedScope != null && shared?.includes(records[0]) === true
        ? sharedScope
        : module
    return {
      declaration:
        records == null
          ? undefined
          : {
              module: owner,
              name,
              records: owner.declarations.get(name) ?? records,
            },
      namespace,
    }
  }

  private async resolveExport(
    module: DeclarationModule,
    name: string,
    seen: Set<string>
  ): Promise<ResolvedSymbol | undefined> {
    const key = `${module.id}:export:${name}`
    if (seen.has(key)) return undefined
    const next = new Set(seen).add(key)
    const binding = module.exports.get(name)
    if (binding != null) return this.resolveBinding(module, binding, next)
    if (module.exportAssignment != null) {
      const assigned = await this.resolveBinding(module, module.exportAssignment, next)
      if (name === "default") return assigned
      if (assigned?.namespace != null) return this.resolveExport(assigned.namespace, name, next)
    }
    return this.resolveWildcard(module, name, next)
  }

  private async resolveWildcard(
    module: DeclarationModule,
    name: string,
    seen: Set<string>
  ): Promise<ResolvedSymbol | undefined> {
    const candidates: ResolvedSymbol[] = []
    for (const request of module.stars) {
      const dependency = await this.dependency(module, request)
      if (dependency == null || name === "default") continue
      const resolved = await this.resolveExport(dependency, name, seen)
      if (resolved != null && !candidates.some((item) => sameSymbol(item, resolved))) {
        candidates.push(resolved)
      }
    }
    return candidates.length === 1 ? candidates[0] : undefined
  }

  private async resolveBinding(
    module: DeclarationModule,
    binding: DeclarationBinding,
    seen: Set<string>
  ): Promise<ResolvedSymbol | undefined> {
    if (binding.request == null)
      return this.resolveSymbol(binding.module ?? module, binding.name, seen)
    const dependency = await this.dependency(module, binding.request)
    if (dependency == null) return undefined
    if (binding.name !== "*") return this.resolveExport(dependency, binding.name, seen)
    if (dependency.exportAssignment != null)
      return this.resolveBinding(dependency, dependency.exportAssignment, seen)
    return { namespace: dependency }
  }

  private async dependency(
    module: DeclarationModule,
    request: string
  ): Promise<DeclarationModule | undefined> {
    const existing = module.dependencies.get(request)
    const key = `${module.file}:${request}`
    if (existing != null || this.missingImports.has(key)) return existing
    const file =
      this.options.resolveImport != null
        ? await this.options.resolveImport(module.file, request)
        : await resolveDeclarationImport(module.file, request, {
            packageRoot: this.options.packageRoot,
            declarationFiles: this.declarationFiles,
          })
    if (file == null) {
      this.missingImports.add(key)
      return undefined
    }
    const dependency = await this.read(file)
    module.dependencies.set(request, dependency)
    return dependency
  }
}

function sameDeclaration(left: ResolvedDeclaration, right: ResolvedDeclaration): boolean {
  return left.module === right.module && left.name === right.name
}

function sameSymbol(left: ResolvedSymbol, right: ResolvedSymbol): boolean {
  if (left.namespace != null || right.namespace != null) return left.namespace === right.namespace
  return (
    left.declaration != null &&
    right.declaration != null &&
    sameDeclaration(left.declaration, right.declaration)
  )
}
