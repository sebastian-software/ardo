import type { ConfigEnv, ConfigPluginContext, Plugin, UserConfig, ViteDevServer } from "vite"

import { EventEmitter } from "node:events"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { NativeApiProject } from "../api/native-project"
import { createApiPlugin } from "./api-plugin"
import { ardoPlugin } from "./plugin"
import { createRoutesModule } from "./routes-plugin"

let temporary: string
const plugins: Plugin[] = []
const context: ConfigPluginContext = {
  debug: vi.fn<() => void>(),
  info: vi.fn<() => void>(),
  warn: vi.fn<() => void>(),
  error(error) {
    throw new Error(typeof error === "string" ? error : error.message)
  },
  meta: { rolldownVersion: "0.0.0", rollupVersion: "0.0.0", viteVersion: "0.0.0" },
}

beforeEach(async () => {
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-native-vite-"))
  await fs.mkdir(path.join(temporary, "src"))
  await fs.mkdir(path.join(temporary, "app/routes"), { recursive: true })
  await fs.writeFile(
    path.join(temporary, "app/routes/home.tsx"),
    "export default function Home() { return null }"
  )
  await fs.writeFile(
    path.join(temporary, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        types: [],
        strict: true,
        noEmit: true,
        rootDir: "./src",
      },
      include: ["src/**/*"],
    })
  )
  await fs.writeFile(
    path.join(temporary, "src/index.ts"),
    "/** Read a value. */\nexport function read() { return 1; }"
  )
})

afterEach(async () => {
  for (const plugin of plugins.splice(0)) {
    await closePlugin(plugin)
  }
  vi.restoreAllMocks()
  await fs.rm(temporary, { recursive: true, force: true })
})

async function configure(
  plugin: Plugin,
  command: "build" | "serve",
  user: UserConfig = { root: temporary }
): Promise<void> {
  plugins.push(plugin)
  const env: ConfigEnv = {
    command,
    mode: command === "build" ? "production" : "development",
    isPreview: false,
    isSsrBuild: false,
  }
  const hook = typeof plugin.config === "function" ? plugin.config : plugin.config?.handler
  await hook?.call(context, user, env)
}

function attachServer(plugin: Plugin) {
  const watcher = Object.assign(new EventEmitter(), { add: vi.fn() })
  const ws = { send: vi.fn() }
  const logger = { error: vi.fn() }
  // The harness provides the watcher and transport used by this plugin.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const server = {
    watcher,
    ws,
    environments: {},
    config: { logger },
    moduleGraph: { invalidateAll: vi.fn() },
    httpServer: new EventEmitter(),
  } as unknown as ViteDevServer
  const hook =
    typeof plugin.configureServer === "function"
      ? plugin.configureServer
      : plugin.configureServer?.handler
  if (hook != null) Reflect.apply(hook, {}, [server])
  return { watcher, ws, logger, server }
}

/** The route table Ardo would serve for the temporary project. */
const routeTable = () =>
  createRoutesModule({ root: temporary, routesDir: path.join(temporary, "app/routes") })
const pageFile = () => path.join(temporary, "app/routes/api-reference/functions/read.md")
const readPage = async () => fs.readFile(pageFile(), "utf8")
// Native compiler updates need the same polling window as the real watcher tests.
const pollOptions = { timeout: 10_000 }

describe("native API build and development plugin", () => {
  it("generates native Markdown before route scanning and closes build sessions", async () => {
    const selected = ardoPlugin({ api: true, githubPages: false })
    const apiIndex = selected.findIndex((plugin) => plugin.name === "ardo:api")
    const routesIndex = selected.findIndex((plugin) => plugin.name === "ardo:routes")
    expect(apiIndex).toBeLessThan(routesIndex)
    expect(selected[apiIndex].enforce).toBe("pre")
    const close = vi.spyOn(NativeApiProject.prototype, "close")
    await configure(selected[apiIndex], "build")
    expect(close).toHaveBeenCalledTimes(1)
    expect(routeTable()).toContain(
      'id: "app/routes/api-reference/functions/read.md", path: "/api-reference/functions/read"'
    )
    expect(await readPage()).toContain("Read a value.")
  })

  it("updates source docs, keeps successful pages on errors, recovers, removes exports, and cleans up listeners", async () => {
    const plugin = createApiPlugin(true)
    await configure(plugin, "serve")
    const { watcher, ws, logger } = attachServer(plugin)
    const source = path.join(temporary, "src/index.ts")
    await fs.writeFile(
      source,
      '/** Updated documentation. */\nexport function read() { return "guest"; }'
    )
    watcher.emit("change", source)
    await expect.poll(readPage, pollOptions).toContain("Updated documentation.")
    expect(await readPage()).toContain("string")
    const good = await readPage()
    await fs.writeFile(source, 'export function read(): number { return "wrong"; }')
    watcher.emit("change", source)
    await expect.poll(() => logger.error.mock.calls.length, pollOptions).toBe(1)
    expect(await readPage()).toBe(good)
    expect(ws.send.mock.calls.at(-1)?.[0]).toMatchObject({
      type: "error",
      err: { plugin: "ardo:api" },
    })
    await fs.writeFile(source, "/** Recovered. */\nexport function read() { return true; }")
    watcher.emit("change", source)
    await expect.poll(readPage, pollOptions).toContain("Recovered.")
    expect(await readPage()).toContain("boolean")
    await fs.writeFile(source, 'export * from "./added.js";')
    const added = path.join(temporary, "src/added.ts")
    await fs.writeFile(added, '/** New export. */\nexport const label = "retained";')
    watcher.emit("add", added)
    watcher.emit("change", source)
    await expect
      .poll(
        async () =>
          fs
            .readFile(path.join(temporary, "app/routes/api-reference/variables/label.md"), "utf8")
            .catch(() => ""),
        pollOptions
      )
      .toContain("New export.")
    await expect(fs.access(pageFile())).rejects.toMatchObject({ code: "ENOENT" })
    expect(routeTable()).toContain('path: "/api-reference/variables/label"')
    await closePlugin(plugin)
    expect(watcher.listenerCount("change")).toBe(0)
    expect(watcher.listenerCount("add")).toBe(0)
    expect(watcher.listenerCount("unlink")).toBe(0)
  })

  it("suppresses stale snapshots and does not rewrite pages for body-only changes", async () => {
    const plugin = createApiPlugin(true)
    await configure(plugin, "serve")
    const { watcher, ws } = attachServer(plugin)
    const initial = await fs.stat(pageFile(), { bigint: true })
    const source = path.join(temporary, "src/index.ts")
    const { started, release, extraction } = delayNextExtraction()
    await fs.writeFile(
      source,
      '/** Read a value. */\nexport function read() { return "obsolete"; }'
    )
    watcher.emit("change", source)
    await started
    await fs.writeFile(source, "/** Read a value. */\nexport function read() { return true; }")
    watcher.emit("change", source)
    release()
    await expect.poll(readPage, pollOptions).toContain("boolean")
    expect(ws.send.mock.calls.filter(([message]) => message.type === "full-reload")).toHaveLength(1)
    const published = await fs.stat(pageFile(), { bigint: true })
    expect(published.mtimeNs).not.toBe(initial.mtimeNs)
    await fs.writeFile(source, "/** Read a value. */\nexport function read() { return false; }")
    watcher.emit("change", source)
    await expect.poll(() => extraction.mock.calls.length, pollOptions).toBe(3)
    // Closing waits for the update to finish, so this assertion does not race extraction.
    await closePlugin(plugin)
    const unchanged = await fs.stat(pageFile(), { bigint: true })
    expect(unchanged.mtimeNs).toBe(published.mtimeNs)
    expect(ws.send.mock.calls.filter(([message]) => message.type === "full-reload")).toHaveLength(1)
  })

  it("rejects the removed TypeDoc option instead of silently omitting API documentation", () => {
    for (const typedoc of [true, false, { entryPoints: ["./src/index.ts"] }]) {
      // @ts-expect-error TypeDoc configuration was removed in the major migration.
      expect(() => ardoPlugin({ typedoc })).toThrow("The typedoc option was removed")
    }
  })

  it("generates separate native projects before scanning their combined routes", async () => {
    const selected = ardoPlugin({
      githubPages: false,
      api: [
        { entryPoints: ["./src/index.ts"], tsconfig: "./tsconfig.json", out: "api/alpha" },
        { entryPoints: ["./src/index.ts"], tsconfig: "./tsconfig.json", out: "api/beta" },
      ],
    })
    const routesIndex = selected.findIndex((plugin) => plugin.name === "ardo:routes")
    const sources = selected.filter((plugin) => plugin.name === "ardo:api")
    expect(sources).toHaveLength(2)
    for (const source of sources) {
      expect(selected.indexOf(source)).toBeLessThan(routesIndex)
      await configure(source, "build")
    }
    const routes = routeTable()
    expect(routes).toContain('path: "/api/alpha/functions/read"')
    expect(routes).toContain('path: "/api/beta/functions/read"')
  })

  it.each([
    ["api", "api"],
    ["api", "api/alpha"],
    ["api/alpha", "api/alpha/../alpha"],
    ["api/alpha", "API/ALPHA"],
  ])(
    "rejects overlapping outputs %s and %s before compiler startup or writes",
    async (first, second) => {
      const extract = vi.spyOn(NativeApiProject.prototype, "extract")
      const selected = ardoPlugin({
        api: [first, second].map((out) => ({
          entryPoints: ["./src/index.ts"],
          tsconfig: "./tsconfig.json",
          out,
        })),
      })
      const source = selected.find((plugin) => plugin.name === "ardo:api")!
      await expect(configure(source, "build")).rejects.toThrow("non-overlapping api.out")
      expect(extract).not.toHaveBeenCalled()
      await expect(fs.access(path.join(temporary, "app/routes/api"))).rejects.toMatchObject({
        code: "ENOENT",
      })
    }
  )

  it("rejects an empty project list", () => {
    expect(() => ardoPlugin({ api: [] })).toThrow("at least one project")
  })

  it("closes earlier development sessions if a later project fails during initialization", async () => {
    await fs.writeFile(
      path.join(temporary, "src/broken.ts"),
      'export const value: number = "wrong";'
    )
    await fs.writeFile(
      path.join(temporary, "valid.json"),
      JSON.stringify({ extends: "./tsconfig.json", files: ["src/index.ts"], include: [] })
    )
    const extraction = vi.spyOn(NativeApiProject.prototype, "extract")
    const close = vi.spyOn(NativeApiProject.prototype, "close")
    const sources = ardoPlugin({
      api: [
        { entryPoints: ["./src/index.ts"], tsconfig: "./valid.json", out: "api/valid" },
        { entryPoints: ["./src/broken.ts"], tsconfig: "./tsconfig.json", out: "api/invalid" },
      ],
    }).filter((plugin) => plugin.name === "ardo:api")
    await configure(sources[0], "serve")
    await expect(configure(sources[1], "serve")).rejects.toThrow("not assignable")
    for (const project of extraction.mock.contexts) expect(close.mock.contexts).toContain(project)
    await fs.writeFile(path.join(temporary, "src/broken.ts"), 'export const value = "fixed";')
    await configure(sources[0], "serve")
    await configure(sources[1], "serve")
    expect(
      await fs.readFile(path.join(temporary, "app/routes/api/invalid/variables/value.md"), "utf8")
    ).toContain("fixed")
  })
})

async function closePlugin(plugin: Plugin): Promise<void> {
  const hook =
    typeof plugin.closeBundle === "function" ? plugin.closeBundle : plugin.closeBundle?.handler
  if (hook != null) await Reflect.apply(hook, {}, [])
}

function delayNextExtraction() {
  // The delegate is called with the original receiver inside the controlled mock.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = NativeApiProject.prototype.extract
  const extraction = vi.spyOn(NativeApiProject.prototype, "extract")
  let release!: () => void
  let ready!: () => void
  const started = new Promise<void>((resolve) => {
    ready = resolve
  })
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  extraction.mockImplementationOnce(async function (this: NativeApiProject, changes) {
    const result = await original.call(this, changes)
    ready()
    await gate
    return result
  })
  return { started, release, extraction }
}

describe("shared native extraction", () => {
  it("reuses a build's extraction for later config evaluations and stops its compiler early", async () => {
    const extract = vi.spyOn(NativeApiProject.prototype, "extract")
    const close = vi.spyOn(NativeApiProject.prototype, "close")
    await configure(createApiPlugin(true), "build")
    expect(close).toHaveBeenCalledTimes(1)
    // React Router's child compiler and prerender server evaluate the config again.
    await configure(createApiPlugin(true), "serve")
    await configure(createApiPlugin(true), "serve")
    expect(extract).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    expect(await readPage()).toContain("Read a value.")
  })

  it("keeps the development compiler for the attached server and shares it with later instances", async () => {
    const extract = vi.spyOn(NativeApiProject.prototype, "extract")
    const close = vi.spyOn(NativeApiProject.prototype, "close")
    const plugin = createApiPlugin(true)
    await configure(plugin, "serve")
    const { watcher } = attachServer(plugin)
    await configure(createApiPlugin(true), "serve")
    expect(extract).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
    const source = path.join(temporary, "src/index.ts")
    await fs.writeFile(source, "/** Shared documentation. */\nexport function read() { return 1; }")
    watcher.emit("change", source)
    await expect.poll(readPage, pollOptions).toContain("Shared documentation.")
    await closePlugin(plugin)
    expect(close).toHaveBeenCalledTimes(1)
    // A server started after the previous one closed compiles again.
    await configure(createApiPlugin(true), "serve")
    expect(extract).toHaveBeenCalledTimes(3)
  })
})

describe("compiler handover", () => {
  it("keeps the compiler for a restarted server until the last holder closes", async () => {
    const close = vi.spyOn(NativeApiProject.prototype, "close")
    const previous = createApiPlugin(true)
    await configure(previous, "serve")
    attachServer(previous)
    // Vite creates the restarted server before it closes the previous one.
    const next = createApiPlugin(true)
    await configure(next, "serve")
    const { watcher } = attachServer(next)
    await closePlugin(previous)
    expect(close).not.toHaveBeenCalled()
    const source = path.join(temporary, "src/index.ts")
    await fs.writeFile(source, "/** After restart. */\nexport function read() { return 1; }")
    watcher.emit("change", source)
    await expect.poll(readPage, pollOptions).toContain("After restart.")
    await closePlugin(next)
    expect(close).toHaveBeenCalledTimes(1)
  })
})
