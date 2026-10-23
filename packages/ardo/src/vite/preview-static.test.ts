import type { PreviewServer } from "vite"

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { preview } from "vite"
import { afterEach, describe, expect, it } from "vitest"

import { configureStaticPreview } from "./preview-static"

const directories: string[] = []
const servers: PreviewServer[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) await server.close()
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

async function startPreview(base: string): Promise<string> {
  const root = mkdtempSync(path.join(os.tmpdir(), "ardo-preview-paths-"))
  directories.push(root)
  const output = path.join(root, "dist")
  mkdirSync(output)
  writeFileSync(path.join(output, "index.html"), "<html><body>Home counter</body></html>")
  for (const name of ["release-6.0", "café-6.0", "c#-6.0"]) {
    const directory = path.join(output, "guide", name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(path.join(directory, "index.html"), "<html><body>Dotted page</body></html>")
  }
  const server = await preview({
    root,
    base,
    configFile: false,
    appType: "mpa",
    build: { outDir: "dist" },
    preview: { host: "127.0.0.1", port: 0, strictPort: true },
    plugins: [
      {
        name: "ardo-preview-regression",
        configurePreviewServer(instance) {
          const post = configureStaticPreview(instance)
          instance.middlewares.use((request, response, next) => {
            response.setHeader("X-Preview-Request", request.url ?? "")
            next()
          })
          return post
        },
      },
    ],
  })
  servers.push(server)
  const address = server.httpServer.address()
  if (address == null || typeof address === "string")
    throw new Error("Preview did not bind a TCP port")
  return `http://127.0.0.1:${address.port}`
}

describe("Preview directory URLs", () => {
  it.each(["/", "/project/"])("preserves the root URL under base %s", async (base) => {
    const origin = await startPreview(base)
    for (const search of ["", "?q=typed%20links"]) {
      const pathname = `${base}${search}`
      const response = await fetch(`${origin}${pathname}`)
      expect(response.status).toBe(200)
      expect(await response.text()).toContain("Home counter")
      expect(response.headers.get("X-Preview-Request")).toBe(pathname)
    }
  })

  it("rewrites slashless dotted pages while preserving encoded paths and queries", async () => {
    const base = "/project/"
    const origin = await startPreview(base)
    for (const name of ["release-6.0", "caf%C3%A9-6.0", "c%23-6.0"]) {
      for (const slash of ["", "/"]) {
        const pathname = `${base}guide/${name}${slash}?q=typed%20links`
        const response = await fetch(`${origin}${pathname}`)
        expect(response.status).toBe(200)
        expect(await response.text()).toContain("Dotted page")
        expect(response.headers.get("X-Preview-Request")).toBe(
          `${base}guide/${name}/?q=typed%20links`
        )
      }
    }
  })
})
