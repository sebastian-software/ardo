import type { ConfigEnv, Plugin, UserConfig, ViteDevServer } from "vite"

import path from "node:path"

import type { writeDeclarationProject } from "../api/generator"
import type { NativeApiProject, NativeCompilerError } from "../api/native-project"
import type { renderDeclarationDocs } from "../api/renderer"
import type { NativeApiDocsConfig, NativeApiExtraction, NativeApiFileChanges } from "../api/types"

import { resolveGeneratedDocsDirectory } from "../generated-docs"
import { isPathInsideDirectory, resolveRoutesDir } from "./path-utils"
import { writeRoutesFileSync } from "./routes-core"

type ApiBackend = {
  NativeApiProject: typeof NativeApiProject
  NativeCompilerError: typeof NativeCompilerError
  writeDeclarationProject: typeof writeDeclarationProject
  renderDeclarationDocs: typeof renderDeclarationDocs
}

type FileEvent = "add" | "change" | "unlink"

export function addApiPlugin(
  plugins: Plugin[],
  options: { api?: NativeApiDocsConfig | true; typedoc?: unknown; routesDirOption?: string }
): void {
  const { api, typedoc, routesDirOption } = options
  if (api == null) return
  if (typedoc != null)
    throw new Error(
      "[ardo] Configure api or typedoc, not both. Source API documentation uses the native TypeScript API."
    )
  plugins.unshift(createApiPlugin(api, routesDirOption))
}

export function createApiPlugin(
  options: NativeApiDocsConfig | true,
  routesDirOption?: string
): Plugin {
  let state = new ApiPluginState(options, routesDirOption)
  const sessions = new WeakMap<object, ApiPluginState>()
  return {
    name: "ardo:api",
    enforce: "pre",
    async config(userConfig, env) {
      if (state.attached) state = new ApiPluginState(options, routesDirOption)
      await state.initialize(userConfig, env)
    },
    configureServer(server) {
      state.attach(server)
      for (const environment of Object.values(server.environments)) sessions.set(environment, state)
    },
    async closeBundle() {
      await sessionForContext(this, sessions, state)?.stop()
    },
  }
}

class ApiPluginState {
  private root = process.cwd()
  private routesDir: string
  private config: NativeApiDocsConfig
  private backend?: ApiBackend
  private project?: NativeApiProject
  private server?: ViteDevServer
  private watchFiles = new Set<string>()
  private initialized = false
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
    private readonly routesDirOption?: string
  ) {
    this.routesDir = resolveRoutesDir(this.root, routesDirOption)
    this.config = this.resolveConfig()
  }

  get attached(): boolean {
    return this.server != null
  }

  async initialize(userConfig: UserConfig, env: ConfigEnv): Promise<void> {
    if (this.initialized) return
    this.root = path.resolve(userConfig.root ?? process.cwd())
    this.routesDir = resolveRoutesDir(this.root, this.routesDirOption)
    this.config = this.resolveConfig()
    resolveGeneratedDocsDirectory(this.routesDir, this.config.out ?? "api-reference", "api.out")
    this.backend = await loadBackend()
    this.project = new this.backend.NativeApiProject(this.config)
    try {
      const result = await this.project.extract()
      this.updateWatchFiles(result.watchFiles)
      await this.publish(result)
      this.initialized = true
    } catch (error) {
      await this.project.close()
      throw error
    } finally {
      if (env.command === "build") await this.project.close()
    }
  }

  attach(server: ViteDevServer): void {
    this.server = server
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
    const project = this.project
    if (project == null) return
    while (this.pending.size > 0 && !this.closing) {
      const revision = this.revision
      const changes = collectChanges(this.pending)
      this.pending.clear()
      try {
        const result = await project.extract(changes)
        this.updateWatchFiles(result.watchFiles)
        if (this.isCurrent(revision)) await this.publish(result)
      } catch (error) {
        if (this.isCurrent(revision)) this.reportError(error)
      }
    }
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

function sessionForContext(
  context: { environment?: object },
  sessions: WeakMap<object, ApiPluginState>,
  fallback: ApiPluginState
): ApiPluginState | undefined {
  return context.environment == null ? fallback : sessions.get(context.environment)
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
