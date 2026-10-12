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

type Binding = { name: string; request?: string }

export type DeclarationModule = {
  file: string
  source: string
  comments: Comment[]
  declarations: Map<string, DeclarationRecord[]>
  globalDeclarations: Map<string, DeclarationRecord[]>
  imports: Map<string, Binding>
  exports: Map<string, Binding>
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
    return this.libraries.has(module)
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
    if (seen.has(module.file)) return new Map()
    const next = new Set(seen).add(module.file)
    const result = new Map<string, ResolvedDeclaration>()
    for (const [name, binding] of module.exports) {
      const declaration = await this.resolveBinding(module, binding, new Set())
      if (declaration == null) this.report(module, `Could not resolve public export ${name}.`)
      else result.set(name, declaration)
    }
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
    const key = `${module.file}:${name}`
    if (seen.has(key)) return undefined
    const next = new Set(seen).add(key)
    const records = module.declarations.get(name)
    if (records != null) return { module, name, records }
    const imported = module.imports.get(name)
    if (imported != null) return this.resolveBinding(module, imported, next)
    const namespace = name.split(".")[0]
    const member = name.split(".").at(1)
    const namespaceBinding = module.imports.get(namespace)
    if (member != null && namespaceBinding?.name === "*" && namespaceBinding.request != null) {
      const dependency = await this.dependency(module, namespaceBinding.request)
      if (dependency != null) return this.resolveExport(dependency, member, next)
    }
    return undefined
  }

  private async resolveExport(
    module: DeclarationModule,
    name: string,
    seen: Set<string>
  ): Promise<ResolvedDeclaration | undefined> {
    const key = `${module.file}:export:${name}`
    if (seen.has(key)) return undefined
    const next = new Set(seen).add(key)
    const binding = module.exports.get(name)
    if (binding != null) return this.resolveBinding(module, binding, next)
    const candidates: ResolvedDeclaration[] = []
    for (const request of module.stars) {
      const dependency = await this.dependency(module, request)
      if (dependency == null || name === "default") continue
      const resolved = await this.resolveExport(dependency, name, next)
      if (
        resolved != null &&
        !candidates.some((item) => item.module === resolved.module && item.name === resolved.name)
      ) {
        candidates.push(resolved)
      }
    }
    return candidates.length === 1 ? candidates[0] : undefined
  }

  private async resolveBinding(
    module: DeclarationModule,
    binding: Binding,
    seen: Set<string>
  ): Promise<ResolvedDeclaration | undefined> {
    if (binding.request == null) return this.resolve(module, binding.name, seen)
    const dependency = await this.dependency(module, binding.request)
    return dependency == null ? undefined : this.resolveExport(dependency, binding.name, seen)
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
