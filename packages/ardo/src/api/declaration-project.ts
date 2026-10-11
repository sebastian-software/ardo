import type {
  Comment,
  Declaration,
  TSConstructorType,
  TSFunctionType,
  TSTypeReference,
  VariableDeclarator,
} from "oxc-parser"

import fs from "node:fs/promises"
import path from "node:path"

import type { ApiComment, ApiExtractionDiagnostic } from "./types"

import { createDeclarationModule } from "./declaration-index"

export type DeclarationRecord = {
  node: Declaration | VariableDeclarator
  comment: ApiComment
}

type Binding = { name: string; request?: string }

export type DeclarationModule = {
  file: string
  source: string
  comments: Comment[]
  declarations: Map<string, DeclarationRecord[]>
  imports: Map<string, Binding>
  exports: Map<string, Binding>
  stars: string[]
  dependencies: Map<string, DeclarationModule>
  typeReferences: TSTypeReference[]
  genericScopes: Array<TSConstructorType | TSFunctionType>
}

export type ResolvedDeclaration = {
  module: DeclarationModule
  name: string
  records: DeclarationRecord[]
}

export class DeclarationReader {
  readonly modules = new Map<string, DeclarationModule>()
  readonly diagnostics: ApiExtractionDiagnostic[] = []

  async read(file: string): Promise<DeclarationModule> {
    const absolute = path.resolve(file)
    const existing = this.modules.get(absolute)
    if (existing != null) return existing
    if (!/\.d\.(?:ts|mts|cts)$/u.test(absolute)) {
      throw new Error(
        `[ardo] Expected a declaration entry point (.d.ts, .d.mts, or .d.cts): ${file}`
      )
    }

    const source = await fs.readFile(absolute, "utf8")
    const module = createDeclarationModule(absolute, source, (message) => {
      this.report({ file: absolute }, message)
    })
    this.modules.set(absolute, module)
    const requests = new Set([
      ...module.stars,
      ...[...module.imports.values(), ...module.exports.values()].flatMap((binding) =>
        binding.request == null ? [] : [binding.request]
      ),
    ])
    for (const request of requests) {
      if (!request.startsWith(".")) continue
      const dependency = await resolveRelativeDeclaration(absolute, request)
      if (dependency != null) module.dependencies.set(request, await this.read(dependency))
    }
    return module
  }

  report(module: Pick<DeclarationModule, "file">, message: string): void {
    if (!this.diagnostics.some((item) => item.file === module.file && item.message === message)) {
      this.diagnostics.push({ file: module.file, message })
    }
  }

  exportsOf(module: DeclarationModule, seen = new Set<string>()): Map<string, ResolvedDeclaration> {
    if (seen.has(module.file)) return new Map()
    const next = new Set(seen).add(module.file)
    const result = new Map<string, ResolvedDeclaration>()
    for (const [name, binding] of module.exports) {
      const declaration = this.resolveBinding(module, binding, new Set())
      if (declaration == null) this.report(module, `Could not resolve public export ${name}.`)
      else result.set(name, declaration)
    }
    const ambiguous = new Set<string>()
    for (const request of module.stars) {
      const dependency = module.dependencies.get(request)
      if (dependency == null) {
        this.report(module, `Could not expand export * from ${JSON.stringify(request)}.`)
        continue
      }
      this.appendWildcard(module, this.exportsOf(dependency, next), { result, ambiguous })
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

  resolve(
    module: DeclarationModule,
    name: string,
    seen = new Set<string>()
  ): ResolvedDeclaration | undefined {
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
      const dependency = module.dependencies.get(namespaceBinding.request)
      if (dependency != null) return this.resolveExport(dependency, member, next)
    }
    return undefined
  }

  private resolveExport(
    module: DeclarationModule,
    name: string,
    seen: Set<string>
  ): ResolvedDeclaration | undefined {
    const key = `${module.file}:export:${name}`
    if (seen.has(key)) return undefined
    const next = new Set(seen).add(key)
    const binding = module.exports.get(name)
    if (binding != null) return this.resolveBinding(module, binding, next)
    const candidates: ResolvedDeclaration[] = []
    for (const request of module.stars) {
      const dependency = module.dependencies.get(request)
      if (dependency == null || name === "default") continue
      const resolved = this.resolveExport(dependency, name, next)
      if (
        resolved != null &&
        !candidates.some((item) => item.module === resolved.module && item.name === resolved.name)
      ) {
        candidates.push(resolved)
      }
    }
    return candidates.length === 1 ? candidates[0] : undefined
  }

  private resolveBinding(
    module: DeclarationModule,
    binding: Binding,
    seen: Set<string>
  ): ResolvedDeclaration | undefined {
    if (binding.request == null) return this.resolve(module, binding.name, seen)
    const dependency = module.dependencies.get(binding.request)
    return dependency == null ? undefined : this.resolveExport(dependency, binding.name, seen)
  }
}

async function resolveRelativeDeclaration(
  file: string,
  request: string
): Promise<string | undefined> {
  const base = path.resolve(path.dirname(file), request)
  const candidates = declarationCandidates(base)
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) return candidate
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        (error.code !== "ENOENT" && error.code !== "ENOTDIR")
      )
        throw error
    }
  }
  return undefined
}

function sameDeclaration(left: ResolvedDeclaration, right: ResolvedDeclaration): boolean {
  return left.module === right.module && left.name === right.name
}

function declarationCandidates(base: string): string[] {
  if (/\.d\.(?:ts|mts|cts)$/u.test(base)) return [base]
  const extensions = new Map([
    [".js", ".d.ts"],
    [".mjs", ".d.mts"],
    [".cjs", ".d.cts"],
    [".ts", ".d.ts"],
    [".mts", ".d.mts"],
    [".cts", ".d.cts"],
  ])
  const extension = path.extname(base)
  const declarationExtension = extensions.get(extension)
  if (declarationExtension != null) return [base.slice(0, -extension.length) + declarationExtension]
  return [`${base}.d.ts`, `${base}.d.mts`, `${base}.d.cts`, path.join(base, "index.d.ts")]
}
