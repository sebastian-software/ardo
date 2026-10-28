import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { scanRoutesSync } from "./routes-core"
import { createRoutesModule } from "./routes-plugin"

let routesDir: string

beforeEach(async () => {
  routesDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-routes-"))
})

afterEach(async () => {
  await fs.rm(routesDir, { force: true, recursive: true })
})

describe("scanRoutesSync", () => {
  it.each([
    { files: ["home.tsx", "index.mdx"], url: "/" },
    { files: ["guide/intro.md", "guide/intro.mdx"], url: "/guide/intro" },
    { files: ["guide.mdx", "guide/index.md", "guide/home.tsx"], url: "/guide" },
    { files: ["en/home.tsx", "en/index.mdx"], url: "/en" },
  ])("rejects multiple route files for $url: $files", async ({ files, url }) => {
    for (const file of files) await writeRoute(file, "# Duplicate")

    expect(scan).toThrow(`Multiple route files resolve to the same URL`)
    expect(scan).toThrow(url)
    for (const file of files) expect(scan).toThrow(path.join(routesDir, file))
  })

  it.each(["guide/c#-6.0.mdx", "c#/intro.md", "guide/c#-6.0.tsx"])(
    "rejects URL delimiters in route files and directories: %s",
    async (file) => {
      await writeRoute(file, "export default function Page() { return null }")
      expect(scan).toThrow("URL-reserved character (# or ?)")
      expect(scan).toThrow(path.join(routesDir, file))
      expect(scan).toThrow("Rename the file or directory")
    }
  )

  it("keeps translated routes and dynamic routes distinct", async () => {
    await writeRoute("en/guide/intro.mdx", "# English")
    await writeRoute("de/guide/intro.mdx", "# Deutsch")
    await writeRoute("en/guide/$slug.mdx", "# Dynamic")

    expect(
      scanRoutesSync({ dir: routesDir, rootDir: routesDir }).map((route) => route.path)
    ).toStrictEqual(["/de/guide/intro", "/en/guide/:slug", "/en/guide/intro"])
  })

  it("only strips markdown extensions from the end of route paths", async () => {
    await writeRoute("v1.md/changelog.md", "# Changelog")

    expect(scanRoutesSync({ dir: routesDir, rootDir: routesDir })).toContainEqual({
      file: "routes/v1.md/changelog.md",
      filePath: path.join(routesDir, "v1.md/changelog.md"),
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
        expect.objectContaining({ file: "routes/home.tsx", isIndex: true, path: "/" }),
        expect.objectContaining({ file: "routes/guide/index.mdx", isIndex: true, path: "/guide" }),
        expect.objectContaining({
          file: "routes/guide/$slug.md",
          isIndex: false,
          path: "/guide/:slug",
        }),
      ])
    )
    expect(routes.some((route) => route.file.includes("_private"))).toBe(false)
    expect(routes.some((route) => route.file.includes("_drafts"))).toBe(true)
  })
})

describe("createRoutesModule", () => {
  it("imports the root module and loads every page lazily", async () => {
    const appDir = path.join(routesDir, "app")
    const pages = path.join(appDir, "routes")
    await fs.mkdir(path.join(pages, "guide"), { recursive: true })
    await fs.writeFile(path.join(appDir, "root.tsx"), "export default function Root() {}")
    await fs.writeFile(path.join(pages, "home.tsx"), "export default function Home() {}")
    await fs.writeFile(path.join(pages, "guide/intro.mdx"), "# Intro")

    const source = createRoutesModule({ root: routesDir, routesDir: pages })

    expect(source).toContain(
      `import * as rootModule from ${JSON.stringify(path.join(appDir, "root.tsx"))}`
    )
    // Ardo's stylesheet follows the root module, whose CSS can declare layer order.
    expect(source.indexOf('import "ardo/ui/styles.css"')).toBeGreaterThan(
      source.indexOf("import * as rootModule")
    )
    expect(source).toContain('{ id: "app/routes/home.tsx", path: "/", load: () => import(')
    expect(source).toContain(
      '{ id: "app/routes/guide/intro.mdx", path: "/guide/intro", load: () => import('
    )
  })

  it("falls back to ArdoRoot without a root module", () => {
    const source = createRoutesModule({
      root: routesDir,
      routesDir: path.join(routesDir, "routes"),
    })
    expect(source).toContain(
      'import { ArdoRoot } from "ardo/ui"\nconst rootModule = { default: ArdoRoot }'
    )
    expect(source).not.toContain("import * as rootModule")
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}

function scan() {
  return scanRoutesSync({ dir: routesDir, rootDir: routesDir })
}
