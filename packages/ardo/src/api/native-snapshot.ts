import type { StringLiteralLikeNode } from "@typescript/native/ast"
import type * as NativeCompiler from "@typescript/native/async"

import fs from "node:fs/promises"
import path from "node:path"

import type {
  ApiExtractionDiagnostic,
  NativeApiDocsConfig,
  NativeApiExtraction,
  NativeApiFileChanges,
} from "./types"

import { extractDeclarations } from "./extractor"

type CompilerDiagnostic = {
  code: number
  text: string
  fileName?: string
  startPosition?: { line: number; character: number }
}
type DeclarationOutput = {
  files: Map<string, string>
  sourceToDeclaration: Map<string, string>
  declarationToSource: Map<string, string>
}

export class NativeCompilerError extends Error {
  readonly diagnostics: Array<{ code: number } & ApiExtractionDiagnostic>

  constructor(
    diagnostics: readonly CompilerDiagnostic[],
    readonly watchFiles: string[]
  ) {
    const formatted = diagnostics.map((item) => {
      const location = item.startPosition
      return {
        file: item.fileName ?? "tsconfig",
        code: item.code,
        message: `${location == null ? "" : `${location.line + 1}:${location.character + 1}: `}TS${item.code}: ${item.text}`,
      }
    })
    super(
      `[ardo:api] Native TypeScript declaration generation failed.\n${formatted.map((item) => `${item.file}: ${item.message}`).join("\n")}`
    )
    this.name = "NativeCompilerError"
    this.diagnostics = formatted
  }
}

export async function updateDocumentationSnapshot(
  api: NativeCompiler.API,
  previous: NativeCompiler.Snapshot | undefined,
  options: { configPath: string; changes: NativeApiFileChanges }
): Promise<NativeCompiler.Snapshot> {
  const { configPath, changes } = options
  const config = await api.readConfigFile(configPath)
  if (config.error != null) throw new NativeCompilerError([config.error], [configPath])
  if (!isRecord(config.config)) throw new Error("[ardo:api] Expected an object in api.tsconfig.")
  const compilerOptions = config.config.compilerOptions
  if (compilerOptions != null && !isRecord(compilerOptions))
    throw new Error("[ardo:api] Expected an object in tsconfig.compilerOptions.")
  const params = {
    fileSystem: {
      kind: "layer" as const,
      files: {
        [configPath]: JSON.stringify({
          ...config.config,
          compilerOptions: {
            ...compilerOptions,
            noEmit: false,
            declaration: true,
            declarationMap: true,
            emitDeclarationOnly: true,
            noEmitOnError: true,
            removeComments: false,
          },
        }),
      },
    },
    fileNotifications: changes,
    ensurePrograms: true as const,
  }
  const snapshot =
    previous == null
      ? await api.createSnapshot({ ...params, openProjects: [configPath] })
      : await previous.update(params)
  await previous?.dispose()
  return snapshot
}

export async function extractNativeDeclarations(
  program: NativeCompiler.Program,
  config: NativeApiDocsConfig,
  client: typeof NativeCompiler
): Promise<NativeApiExtraction> {
  const inputFiles = await program.getSourceFileNames()
  const configFiles = await program.getConfigFileNames()
  const watchFiles = [
    ...new Set([
      ...inputFiles,
      ...configFiles,
      path.join(path.dirname(config.tsconfig), "package.json"),
    ]),
  ]
  const output = await program.emitToString(client.EmitOnly.OnlyDts)
  if (output.emitSkipped || output.diagnostics.some((item) => item.category === 1))
    throw new NativeCompilerError(output.diagnostics, watchFiles)
  const declarations = collectDeclarations(output)
  const entryPoints = await resolveEntryPoints(config.entryPoints, inputFiles, declarations)
  const project = await extractDeclarations(entryPoints, {
    declarationFiles: declarations.files,
    libFiles: await selectedLibraryFiles(program, inputFiles),
    packageRoot: path.dirname(config.tsconfig),
    resolveImport: createImportResolver(program, declarations, client),
  })
  return {
    ...project,
    watchFiles: [
      ...new Set([...watchFiles, ...project.files.filter((file) => !declarations.files.has(file))]),
    ],
  }
}

function collectDeclarations(output: NativeCompiler.EmitOutput): DeclarationOutput {
  const result: DeclarationOutput = {
    files: new Map(),
    sourceToDeclaration: new Map(),
    declarationToSource: new Map(),
  }
  for (const [file, value] of output.outputFiles) {
    if (!isDeclaration(file)) continue
    const declaration = path.resolve(file)
    result.files.set(declaration, value.text)
    if (value.sourceFileName != null) {
      const source = path.resolve(value.sourceFileName)
      result.sourceToDeclaration.set(source, declaration)
      result.declarationToSource.set(declaration, source)
    }
  }
  return result
}

async function resolveEntryPoints(
  entryPoints: string[],
  inputFiles: readonly string[],
  declarations: DeclarationOutput
): Promise<string[]> {
  return Promise.all(
    entryPoints.map(async (file) => {
      const source = await fs.realpath(file)
      const emitted =
        declarations.sourceToDeclaration.get(source) ?? declarations.sourceToDeclaration.get(file)
      if (emitted != null) return emitted
      if (isDeclaration(source) && inputFiles.some((input) => path.resolve(input) === source))
        return source
      throw new Error(
        `[ardo:api] No declaration was emitted for entry point ${file}. Check api.tsconfig and api.entryPoints.`
      )
    })
  )
}

async function selectedLibraryFiles(
  program: NativeCompiler.Program,
  inputFiles: readonly string[]
): Promise<string[]> {
  const declarations = inputFiles.filter((file) => isDeclaration(file))
  const metadata = await Promise.all(
    declarations.map(async (file) => program.getSourceFileMetadata(file))
  )
  return declarations.filter((_file, index) => metadata[index]?.isDefaultLibrary)
}

function createImportResolver(
  program: NativeCompiler.Program,
  declarations: DeclarationOutput,
  client: typeof NativeCompiler
) {
  const compiler = program.getCompilerOptions()
  return async (file: string, request: string): Promise<string | undefined> => {
    const source = declarations.declarationToSource.get(file) ?? file
    const info = await program.getSourceFileMetadata(source)
    // Bundler imports use ES module resolution even when the inferred Node package
    // format is CommonJS. NodeNext uses the source file's package format.
    const mode =
      compiler.module === client.ModuleKind.CommonJS
        ? client.ModuleKind.CommonJS
        : compiler.moduleResolution === client.ModuleResolutionKind.NodeNext
          ? (info?.impliedNodeFormat ?? client.ModuleKind.ESNext)
          : client.ModuleKind.ESNext
    const resolved = await resolveCompilerImport(program, source, { request, fallbackMode: mode })
    if (resolved == null) return undefined
    const target = path.resolve(resolved.resolvedFileName)
    return (
      declarations.sourceToDeclaration.get(target) ?? (isDeclaration(target) ? target : undefined)
    )
  }
}

async function resolveCompilerImport(
  program: NativeCompiler.Program,
  file: string,
  options: { request: string; fallbackMode: NativeCompiler.ModuleKind }
): Promise<NativeCompiler.ResolvedModule | undefined> {
  const { request, fallbackMode } = options
  const source = await program.getSourceFile(file)
  const { isStringLiteralLikeNode } = await import("@typescript/native/ast")
  const specifiers = (source?.imports ?? []).filter(
    (node): node is StringLiteralLikeNode => isStringLiteralLikeNode(node) && node.text === request
  )
  if (specifiers.length === 0) return program.getResolvedModule(file, request, fallbackMode)
  // The compiler selects the original import's mode while resolving its target,
  // avoiding a separate mode query without losing explicit resolution attributes.
  const resolved = await Promise.all(
    specifiers.map(async (specifier) =>
      program.getResolvedModuleFromModuleSpecifier(specifier, file)
    )
  )
  const candidates = new Map(
    resolved.flatMap((item) => (item == null ? [] : [[item.resolvedFileName, item] as const]))
  )
  // A request used in both import and require modes can resolve to different
  // declarations. The declaration reader reports incomplete expansion instead
  // of silently picking one until its bindings carry per-import mode context.
  return candidates.size === 1 ? candidates.values().next().value : undefined
}

function isDeclaration(file: string): boolean {
  return /\.d\.(?:ts|mts|cts)$/u.test(file)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}
