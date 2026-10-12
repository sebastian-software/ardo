import type { Plugin, ViteDevServer } from "vite"

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createServer } from "vite"
import { afterEach, describe, expect, it } from "vitest"

import { addApiPlugin, createApiPlugin } from "./api-plugin"

let server: undefined | ViteDevServer
let temporary: string | undefined

afterEach(async () => {
  await server?.close()
  if (temporary != null) await fs.rm(temporary, { force: true, recursive: true })
})

describe("native API with the real Vite filesystem watcher", () => {
  it("updates independent package projects without overwriting the other package's documentation", async () => {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-native-monorepo-watch-"))
    const sources = new Map<string, string>()
    for (const name of ["alpha", "beta"]) {
      const directory = path.join(temporary, name)
      await fs.mkdir(path.join(directory, "src"), { recursive: true })
      await fs.writeFile(
        path.join(directory, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            types: [],
            strict: true,
            noEmit: true,
          },
          include: ["src/**/*"],
        })
      )
      const source = path.join(directory, "src/index.ts")
      sources.set(name, source)
      await fs.writeFile(
        source,
        `/** Initial ${name} documentation. */\nexport function read() { return 1; }`
      )
    }
    const plugins: Plugin[] = []
    addApiPlugin(plugins, {
      api: ["alpha", "beta"].map((name) => ({
        entryPoints: [`./${name}/src/index.ts`],
        tsconfig: `./${name}/tsconfig.json`,
        out: `api/${name}`,
      })),
    })
    server = await createServer({
      root: temporary,
      configFile: false,
      plugins,
      server: { middlewareMode: true },
      logLevel: "silent",
    })
    const page = (name: string) => path.join(temporary!, `app/routes/api/${name}/functions/read.md`)
    const betaBefore = await fs.stat(page("beta"), { bigint: true })
    await expect
      .poll(() => Object.keys(server?.watcher.getWatched() ?? {}), { timeout: 10_000 })
      .toContain(path.join(temporary, "alpha/src"))
    await fs.writeFile(
      sources.get("alpha")!,
      '/** Updated alpha documentation. */\nexport function read() { return "alpha"; }'
    )
    await expect
      .poll(async () => fs.readFile(page("alpha"), "utf8"), { timeout: 10_000 })
      .toContain("Updated alpha documentation.")
    expect(await fs.readFile(page("alpha"), "utf8")).toContain("string")
    const betaAfter = await fs.stat(page("beta"), { bigint: true })
    expect(betaAfter.mtimeNs).toBe(betaBefore.mtimeNs)
    await fs.writeFile(
      sources.get("beta")!,
      "/** Updated beta documentation. */\nexport function read() { return true; }"
    )
    await expect
      .poll(async () => fs.readFile(page("beta"), "utf8"), { timeout: 10_000 })
      .toContain("Updated beta documentation.")
    expect(await fs.readFile(page("beta"), "utf8")).toContain("boolean")
    expect(await fs.readFile(page("alpha"), "utf8")).toContain("Updated alpha documentation.")
  }, 30_000)
  it("regenerates Markdown from dependency and JSDoc changes without a declaration directory", async () => {
    temporary = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-native-watch-"))
    await fs.mkdir(path.join(temporary, "src"))
    await fs.writeFile(
      path.join(temporary, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          types: [],
          strict: true,
          rootDir: "./src",
          outDir: "./declarations",
          noEmit: true,
        },
        include: ["src/**/*"],
      })
    )
    await fs.writeFile(
      path.join(temporary, "src/index.ts"),
      'import { value } from "./value.js";\nexport function read() { return value; }'
    )
    const dependency = path.join(temporary, "src/value.ts")
    await fs.writeFile(dependency, "export const value = 1;")
    server = await createServer({
      root: temporary,
      configFile: false,
      plugins: [createApiPlugin(true)],
      server: { middlewareMode: true },
      logLevel: "silent",
    })
    const page = path.join(temporary, "app/routes/api-reference/functions/read.md")
    expect(await fs.readFile(page, "utf8")).toContain("number")
    await expect
      .poll(() => Object.keys(server?.watcher.getWatched() ?? {}), { timeout: 10_000 })
      .toContain(path.join(temporary, "src"))
    await fs.writeFile(dependency, 'export const value = "updated";')
    await expect
      .poll(async () => fs.readFile(page, "utf8"), { timeout: 10_000 })
      .toContain("string")
    await fs.writeFile(
      path.join(temporary, "src/index.ts"),
      'import { value } from "./value.js";\n/** Updated live documentation. */\nexport function read() { return value; }'
    )
    await expect
      .poll(async () => fs.readFile(page, "utf8"), { timeout: 10_000 })
      .toContain("Updated live documentation.")
    await server.restart()
    await expect
      .poll(() => Object.keys(server?.watcher.getWatched() ?? {}), { timeout: 10_000 })
      .toContain(path.join(temporary, "src"))
    await fs.writeFile(dependency, "export const value = true;")
    await expect
      .poll(async () => fs.readFile(page, "utf8"), { timeout: 10_000 })
      .toContain("boolean")
    await expect(fs.access(path.join(temporary, "declarations"))).rejects.toMatchObject({
      code: "ENOENT",
    })
  }, 30_000)
})
