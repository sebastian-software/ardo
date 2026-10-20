import { loadNativeCompiler, type NativeCompiler } from "./native-compiler"

import path from "node:path"

import type {
  NativeApiDocsConfig,
  NativeApiDocsResult,
  NativeApiExtraction,
  NativeApiFileChanges,
} from "./types"

import { resolveGeneratedDocsDirectory } from "../generated-docs"
import { writeDeclarationProject } from "./generator"
import { extractNativeDeclarations, updateDocumentationSnapshot } from "./native-snapshot"

export { NativeCompilerError } from "./native-snapshot"

/** One native compiler session, shared by initial generation and subsequent updates. */
export class NativeApiProject {
  private readonly config: NativeApiDocsConfig
  private readonly root: string
  private client?: typeof NativeCompiler
  private api?: NativeCompiler.API
  private snapshot?: NativeCompiler.Snapshot
  private tail: Promise<unknown> = Promise.resolve()
  private closing = false
  private closePromise?: Promise<void>
  private invalidateNext = false

  constructor(config: NativeApiDocsConfig) {
    if (config.entryPoints.length === 0)
      throw new Error("[ardo:api] At least one source entry point is required.")
    this.config = {
      ...config,
      tsconfig: path.resolve(config.tsconfig),
      entryPoints: config.entryPoints.map((file) => path.resolve(file)),
    }
    this.root = path.dirname(this.config.tsconfig)
  }

  async extract(changes: NativeApiFileChanges = {}): Promise<NativeApiExtraction> {
    return this.enqueue(async () => this.extractSnapshot(changes))
  }

  async generate(
    routesDir: string,
    changes: NativeApiFileChanges = {}
  ): Promise<NativeApiDocsResult> {
    resolveGeneratedDocsDirectory(routesDir, this.config.out ?? "api-reference", "api.out")
    return this.enqueue(async () => {
      const project = await this.extractSnapshot(changes)
      const result = await writeDeclarationProject(project, this.config, routesDir)
      return { ...result, watchFiles: project.watchFiles }
    })
  }

  /** Wait for queued operations, dispose snapshots, and terminate the native child. */
  async close(): Promise<void> {
    this.closing = true
    this.closePromise ??= this.dispose()
    await this.closePromise
  }

  private async dispose(): Promise<void> {
    await this.tail
    try {
      await this.snapshot?.dispose()
    } finally {
      await this.api?.close()
    }
  }

  private async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closing) throw new Error("[ardo:api] Native API project is closed.")
    const result = this.tail.then(operation)
    this.tail = result.catch(() => {
      this.invalidateNext = true
    })
    return result
  }

  private async initialize(): Promise<NativeCompiler.API> {
    if (this.api == null) {
      this.client = await loadNativeCompiler()
      this.api = new this.client.API({ cwd: this.root })
    }
    return this.api
  }

  private async extractSnapshot(changes: NativeApiFileChanges): Promise<NativeApiExtraction> {
    const api = await this.initialize()
    const client = this.client
    if (client == null) throw new Error("[ardo:api] Native API client was not initialized.")
    this.snapshot = await updateDocumentationSnapshot(api, this.snapshot, {
      configPath: this.config.tsconfig,
      changes: { ...changes, invalidateAll: changes.invalidateAll === true || this.invalidateNext },
    })
    this.invalidateNext = false
    const program = this.snapshot.getConfiguredProject(this.config.tsconfig)?.program
    if (program == null)
      throw new Error(`[ardo:api] Could not open project ${this.config.tsconfig}.`)
    return extractNativeDeclarations(program, this.config, client)
  }
}

/** Generate once and always dispose the native compiler session. */
export async function generateNativeDocs(
  config: NativeApiDocsConfig,
  routesDir: string
): Promise<NativeApiDocsResult> {
  const project = new NativeApiProject(config)
  try {
    return await project.generate(routesDir)
  } finally {
    await project.close()
  }
}
