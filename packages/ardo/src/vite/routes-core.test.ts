import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { generateRoutesFile, scanRoutesSync } from "./routes-core"

let routesDir: string

beforeEach(async () => {
  routesDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-routes-"))
})

afterEach(async () => {
  await fs.rm(routesDir, { force: true, recursive: true })
})

describe("scanRoutesSync", () => {
  it("only strips markdown extensions from the end of route paths", async () => {
    await writeRoute("v1.md/changelog.md", "# Changelog")

    expect(scanRoutesSync({ dir: routesDir, rootDir: routesDir })).toContainEqual({
      file: "routes/v1.md/changelog.md",
      isIndex: false,
      path: "/v1.md/changelog",
    })
  })

  it("scans md/mdx/tsx routes with index, home, and dynamic segment semantics", async () => {
    await writeRoute("home.tsx", "export default function Home() {}")
    await writeRoute("guide/index.mdx", "# Guide")
    await writeRoute("guide/$slug.md", "# Dynamic")
    await writeRoute("guide/_private.mdx", "# Private")
    await writeRoute("_drafts/hidden.mdx", "# Hidden")

    const routes = scanRoutesSync({ dir: routesDir, rootDir: routesDir })

    expect(routes).toStrictEqual(
      expect.arrayContaining([
        { file: "routes/home.tsx", isIndex: true, path: "/" },
        { file: "routes/guide/index.mdx", isIndex: true, path: "/guide" },
        { file: "routes/guide/$slug.md", isIndex: false, path: "/guide/:slug" },
      ])
    )
    expect(routes.some((route) => route.file.includes("_private"))).toBe(false)
    expect(routes.some((route) => route.file.includes("_drafts"))).toBe(true)
  })
})

describe("generateRoutesFile", () => {
  it("renders root index routes before nested routes", () => {
    const routesFile = generateRoutesFile([
      { file: "routes/guide/$slug.md", path: "/guide/:slug" },
      { file: "routes/home.tsx", isIndex: true, path: "/" },
      { file: "routes/guide/index.mdx", isIndex: true, path: "/guide" },
    ])

    expect(routesFile).toContain('index("routes/home.tsx"),')
    expect(routesFile.indexOf('index("routes/home.tsx"),')).toBeLessThan(
      routesFile.indexOf('route("guide", "routes/guide/index.mdx"),')
    )
    expect(routesFile).toContain('route("guide/:slug", "routes/guide/$slug.md"),')
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}
