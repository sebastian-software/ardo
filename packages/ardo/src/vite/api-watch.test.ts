import type { ViteDevServer } from "vite"

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createServer } from "vite"
import { afterEach, describe, expect, it } from "vitest"

import { createApiPlugin } from "./api-plugin"

let server: undefined | ViteDevServer
let temporary: string | undefined

afterEach(async () => {
  await server?.close()
  if (temporary != null) await fs.rm(temporary, { force: true, recursive: true })
})

describe("native API with the real Vite filesystem watcher", () => {
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
