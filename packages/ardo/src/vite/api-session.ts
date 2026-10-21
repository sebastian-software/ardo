import type { ConfigEnv, UserConfig, ViteDevServer } from "vite"

import path from "node:path"

import type { writeDeclarationProject } from "../api/generator"
import type { NativeApiProject, NativeCompilerError } from "../api/native-project"
import type { renderDeclarationDocs } from "../api/renderer"
import type { NativeApiDocsConfig, NativeApiExtraction, NativeApiFileChanges } from "../api/types"

import { resolveGeneratedDocsDirectory } from "../generated-docs"
import { validateApiOutputs } from "./api-outputs"
import {
  forgetSharedExtraction,
  getSharedExtraction,
  registerSharedExtraction,
  type SharedExtraction,
} from "./api-shared-extraction"
import { isPathInsideDirectory, resolveRoutesDir } from "./path-utils"
import { writeRoutesFileSync } from "./routes-core"

type ApiBackend = {
  NativeApiProject: typeof NativeApiProject
  NativeCompilerError: typeof NativeCompilerError
  writeDeclarationProject: typeof writeDeclarationProject
  renderDeclarationDocs: typeof renderDeclarationDocs
}

type FileEvent = "add" | "change" | "unlink"

export class ApiPluginState {
  private root = process.cwd()
  private routesDir: string
  private config: NativeApiDocsConfig
  private backend?: ApiBackend
  private project?: NativeApiProject
  private server?: ViteDevServer
  private watchFiles = new Set<string>()
  private initialized = false
  private ownsProject = false
  private closing = false
  private revision = 0
  private published?: string
  private hadError = false
  private timer?: ReturnType<typeof setTimeout>
  private running?: Promise<void>
  private closePromise?: Promise<void>
  private readonly pending = new Map<string, FileEvent>()
  private readonly onAdd = (file: string) => {
    this.handleChange("add", file)
  }
  private readonly onChange = (file: string) => {
    this.handleChange("change", file)
  }
  private readonly onUnlink = (file: string) => {
    this.handleChange("unlink", file)
  }

  constructor(
    private readonly options: NativeApiDocsConfig | true,
    private readonly routesDirOption: string | undefined,
    private readonly outputs: string[]
  ) {
    this.routesDir = resolveRoutesDir(this.root, routesDirOption)
    this.config = this.resolveConfig()
  }

  get attached(): boolean {
    return this.server != null
  }

  get stopped(): boolean {
    return this.closing
  }

  async initialize(userConfig: UserConfig, env: ConfigEnv): Promise<void> {
    if (this.initialized) return
    this.root = path.resolve(userConfig.root ?? process.cwd())
    this.routesDir = resolveRoutesDir(this.root, this.routesDirOption)
    this.config = this.resolveConfig()
    validateApiOutputs(this.routesDir, this.outputs)
    this.backend = await loadBackend()
    const result = await this.extractShared(env.command === "build")
    this.updateWatchFiles(result.watchFiles)
    await this.publish(result)
    this.initialized = true
  }

  private async extractShared(closeAfterwards: boolean): Promise<NativeApiExtraction> {
    const shared = getSharedExtraction(this.config)
    if (shared != null) return shared.result
    const entry = this.startSharedExtraction()
    try {
      const result = await entry.result
      // A build never watches, so the compiler stops as soon as the result exists.
      if (closeAfterwards) await this.closeShared(entry)
      return result
    } catch (error) {
      forgetSharedExtraction(this.config)
      await this.closeShared(entry)
      throw error
    }
  }

  private startSharedExtraction(): SharedExtraction {
    const backend = this.getBackend()
    const project = new backend.NativeApiProject(this.config)
    this.project = project
    this.ownsProject = true
    return registerSharedExtraction(this.config, this, project)
  }

  private async closeShared(entry: SharedExtraction): Promise<void> {
    entry.project = undefined
    await this.project?.close()
  }

  private refreshShared(result: NativeApiExtraction): void {
    const entry = getSharedExtraction(this.config)
    if (entry != null && entry.holders.has(this)) entry.result = Promise.resolve(result)
  }

  /** A restarted server joins the compiler its predecessor still holds. */
  private adoptSharedProject(): void {
    if (this.project != null) return
    const entry = getSharedExtraction(this.config)
    if (entry?.project == null) return
    this.project = entry.project
    this.ownsProject = true
    entry.holders.add(this)
  }

  attach(server: ViteDevServer): void {
    this.server = server
    this.adoptSharedProject()
    this.updateWatchFiles([...this.watchFiles])
    server.watcher.on("add", this.onAdd).on("change", this.onChange).on("unlink", this.onUnlink)
    server.httpServer?.once("close", () => {
      void this.stop().catch((error: unknown) => {
        this.reportError(error)
      })
    })
  }

  async stop(): Promise<void> {
    this.closing = true
    if (this.timer != null) clearTimeout(this.timer)
    this.pending.clear()
    this.server?.watcher
      .off("add", this.onAdd)
      .off("change", this.onChange)
      .off("unlink", this.onUnlink)
    this.closePromise ??= this.dispose()
    await this.closePromise
  }

  private async dispose(): Promise<void> {
    await this.running
    if (!this.ownsProject) return
    const entry = getSharedExtraction(this.config)
    if (entry != null && entry.project === this.project) {
      entry.holders.delete(this)
      // Another server still uses this compiler, for example after a restart.
      if (entry.holders.size > 0) return
      // A closed development compiler must not serve a new server stale output;
      // a finished build's result stays for later config evaluations.
      if (entry.project != null) forgetSharedExtraction(this.config)
    }
    await this.project?.close()
  }

  private resolveConfig(): NativeApiDocsConfig {
    const selected =
      this.options === true
        ? { tsconfig: "./tsconfig.json", entryPoints: ["./src/index.ts"] }
        : this.options
    return {
      ...selected,
      tsconfig: path.resolve(this.root, selected.tsconfig),
      entryPoints: selected.entryPoints.map((file) => path.resolve(this.root, file)),
    }
  }

  private getBackend(): ApiBackend {
    if (this.backend == null) throw new Error("[ardo:api] Native backend was not initialized.")
    return this.backend
  }

  private updateWatchFiles(files: string[]): void {
    this.watchFiles = new Set(files.map((file) => path.resolve(file)))
    this.server?.watcher.add([...this.watchFiles, path.dirname(this.config.tsconfig)])
  }

  private async publish(result: NativeApiExtraction): Promise<void> {
    const backend = this.getBackend()
    const pages = backend.renderDeclarationDocs(
      result.items,
      this.config.out ?? "api-reference",
      this.config.title ?? "API Reference"
    )
    const next = JSON.stringify(pages)
    if (next !== this.published) {
      await backend.writeDeclarationProject(result, this.config, this.routesDir)
      const appDir = path.join(this.root, "app")
      writeRoutesFileSync({
        appDir,
        routesDir: this.routesDir,
        routesFilePath: path.join(appDir, "routes.ts"),
      })
      this.published = next
      this.server?.moduleGraph.invalidateAll()
      this.server?.ws.send({ type: "full-reload" })
    } else if (this.hadError) this.server?.ws.send({ type: "full-reload" })
    this.hadError = false
    for (const diagnostic of result.diagnostics)
      console.warn(`[ardo:api] ${diagnostic.file}: ${diagnostic.message}`)
  }

  private reportError(error: unknown): void {
    if (this.closing || this.server == null) return
    if (error instanceof this.getBackend().NativeCompilerError)
      this.updateWatchFiles(error.watchFiles)
    this.hadError = true
    const message = error instanceof Error ? error.message : String(error)
    this.server.config.logger.error(message)
    this.server.ws.send({
      type: "error",
      err: {
        message,
        stack: error instanceof Error ? (error.stack ?? "") : "",
        plugin: "ardo:api",
      },
    })
  }

  private async drain(): Promise<void> {
    while (this.pending.size > 0 && !this.closing) {
      const revision = this.revision
      const changes = collectChanges(this.pending)
      this.pending.clear()
      try {
        const result = await this.extractChanges(changes)
        this.updateWatchFiles(result.watchFiles)
        if (this.isCurrent(revision)) await this.publish(result)
      } catch (error) {
        if (this.isCurrent(revision)) this.reportError(error)
      }
    }
  }

  private async extractChanges(changes: NativeApiFileChanges): Promise<NativeApiExtraction> {
    // An earlier build already stopped its compiler, so this server starts a live one.
    if (this.project == null) return this.startSharedExtraction().result
    const result = await this.project.extract(changes)
    this.refreshShared(result)
    return result
  }

  private isCurrent(revision: number): boolean {
    return !this.closing && this.revision === revision
  }

  private handleChange(event: FileEvent, file: string): void {
    if (this.closing) return
    const absolute = path.resolve(file)
    if (!this.shouldHandle(absolute)) return
    this.revision++
    this.pending.set(absolute, event)
    if (this.running == null) this.schedule()
  }

  private shouldHandle(file: string): boolean {
    const output = resolveGeneratedDocsDirectory(
      this.routesDir,
      this.config.out ?? "api-reference",
      "api.out"
    )
    if (isPathInsideDirectory(file, output) || file === path.join(this.root, "app/routes.ts"))
      return false
    return (
      this.watchFiles.has(file) ||
      (isPathInsideDirectory(file, path.dirname(this.config.tsconfig)) &&
        (/\.[cm]?[jt]sx?$/u.test(file) || path.basename(file) === "package.json"))
    )
  }

  private schedule(): void {
    if (this.timer != null) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = undefined
      this.running = this.drain().finally(() => {
        this.running = undefined
        if (!this.closing && this.pending.size > 0) this.schedule()
      })
    }, 40)
  }
}

function collectChanges(pending: Map<string, FileEvent>): NativeApiFileChanges {
  const changed: string[] = [],
    created: string[] = [],
    deleted: string[] = []
  for (const [file, event] of pending) {
    if (event === "add") created.push(file)
    else if (event === "unlink") deleted.push(file)
    else changed.push(file)
  }
  return {
    changed,
    created,
    deleted,
    invalidateAll: [...pending.keys()].some((file) => path.basename(file) === "package.json"),
  }
}

async function loadBackend(): Promise<ApiBackend> {
  const [project, generator, renderer] = await Promise.all([
    import("../api/native-project"),
    import("../api/generator"),
    import("../api/renderer"),
  ])
  return {
    NativeApiProject: project.NativeApiProject,
    NativeCompilerError: project.NativeCompilerError,
    writeDeclarationProject: generator.writeDeclarationProject,
    renderDeclarationDocs: renderer.renderDeclarationDocs,
  }
}
