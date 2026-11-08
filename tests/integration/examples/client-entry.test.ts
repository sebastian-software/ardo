import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { gzipSync } from "node:zlib"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createTestProject } from "./project"

type PageData = { module?: string; routeId?: string }

const directories: string[] = []
afterAll(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

function project(): string {
  const directory = fs.realpathSync(createTestProject())
  directories.push(directory)
  return directory
}

function build(directory: string): string {
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
  return path.join(directory, "build/client")
}

function configure(directory: string, options: Record<string, unknown>): void {
  fs.writeFileSync(
    path.join(directory, "ardo.config.ts"),
    `import { defineArdoConfig } from "ardo/config";
export default defineArdoConfig(${JSON.stringify({ title: "Client entry", ...options })});
`
  )
}

function htmlFiles(directory: string): string[] {
  return fs
    .readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".html"))
    .map((file) => path.join(directory, file))
}

function readPageData(html: string): PageData | undefined {
  const attribute = /data-ardo-page="([^"]*)"/u.exec(html)?.[1]
  if (attribute == null) return undefined
  // The server serializes ArdoPageData into this attribute.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return JSON.parse(attribute.replaceAll("&quot;", '"').replaceAll("&amp;", "&")) as PageData
}

function modulePreloads(html: string): string[] {
  return [...html.matchAll(/<link rel="modulepreload" href="([^"]+)"/gu)].map(
    (match) => match[1] ?? ""
  )
}

/** The names a built ES module chunk exports, from its trailing `export { … }` list. */
function exportedNames(chunk: string): string[] {
  const list = [...chunk.matchAll(/export\s*\{([^}]*)\}/gu)].at(-1)?.[1] ?? ""
  return list
    .split(",")
    .map(
      (specifier) =>
        specifier
          .trim()
          .split(/\s+as\s+/u)
          .at(-1) ?? ""
    )
    .filter(Boolean)
}

function assetFile(client: string, prefix: string): string {
  const assets = path.join(client, "assets")
  const file = fs
    .readdirSync(assets)
    .find((name) => name.startsWith(prefix) && name.endsWith(".js"))
  if (file == null) throw new Error(`No ${prefix}*.js in ${assets}`)
  return path.join(assets, file)
}

describe("the client entry without the route table", () => {
  let client: string

  beforeAll(() => {
    const directory = project()
    configure(directory, { base: "/project/" })
    // The root module also imports this route statically. It must still load
    // as a page with its original exports.
    fs.writeFileSync(
      path.join(directory, "app/routes/guide/shared-note.tsx"),
      `export const noteTitle = "Shared note"
export const meta = () => [{ title: "Shared note page" }]
export default function SharedNote() { return <p>{noteTitle}</p> }
`
    )
    fs.appendFileSync(
      path.join(directory, "app/root.tsx"),
      `export { noteTitle } from "./routes/guide/shared-note"\n`
    )
    client = build(directory)
  }, 180_000)

  function readPages() {
    return htmlFiles(client)
      .map((file) => ({ file, html: fs.readFileSync(file, "utf8") }))
      .map((page) => ({ ...page, data: readPageData(page.html) }))
      .filter((page) => page.data?.routeId != null)
  }

  it("names the page's own preloaded chunk as its module", () => {
    const pages = readPages()
    expect(pages.length).toBeGreaterThanOrEqual(4)
    const loaders = fs.readFileSync(assetFile(client, "page-loaders-"), "utf8")
    for (const page of pages) {
      expect(page.data?.module, page.file).toMatch(/^\/project\/assets\/.+\.js$/u)
      expect(modulePreloads(page.html), page.file).toContain(page.data?.module)
      // The loader table reaches the same chunk for pages without a module URL.
      expect(loaders).toContain(path.basename(page.data?.module ?? ""))
    }
  })

  it("keeps a statically imported route a page chunk with its original exports", () => {
    const pages = readPages()
    const note = pages.find((page) => page.data?.routeId === "app/routes/guide/shared-note.tsx")
    expect(note?.html).toContain("Shared note")
    expect(note?.html).toContain("<title>Shared note page</title>")
    // The build still gives this route a chunk of its own and names it as the
    // page's module, so the client imports it directly. The loader table
    // fallback is not exercised in builds.
    const module = note?.data?.module ?? ""
    expect(module).toMatch(/^\/project\/assets\/.+\.js$/u)
    expect(path.basename(module)).not.toMatch(/^entry-client-/u)
    const otherModules = pages.filter((page) => page !== note).map((page) => page.data?.module)
    expect(otherModules).not.toContain(module)
    const chunk = fs.readFileSync(path.join(client, "assets", path.basename(module)), "utf8")
    // The client reads `default` and `meta` from the page module by name.
    expect(exportedNames(chunk)).toEqual(expect.arrayContaining(["default", "meta"]))
  })

  it("gives error pages neither a route nor a module", () => {
    const data = readPageData(fs.readFileSync(path.join(client, "404.html"), "utf8"))
    expect(data).not.toHaveProperty("routeId")
    expect(data).not.toHaveProperty("module")
  })

  it("keeps route ids and page chunk names out of the entry", () => {
    const entry = fs.readFileSync(assetFile(client, "entry-client-"), "utf8")
    expect(entry).not.toContain("app/routes")
    // The root module imports the shared note itself; no other page chunk is named.
    const pageChunks = readPages()
      .filter((page) => page.data?.routeId !== "app/routes/guide/shared-note.tsx")
      .map((page) => path.basename(page.data?.module ?? ""))
    expect(pageChunks.length).toBeGreaterThanOrEqual(3)
    for (const chunk of pageChunks) expect(entry).not.toContain(chunk)
    // The logical paths stay, so links still recognize every page.
    expect(entry).toContain("/guide/getting-started")
  })
})

describe("client entry growth", () => {
  const routeCount = 50

  function routePaths(count: number): string[] {
    return Array.from(
      { length: count },
      (_, index) => `/guide/topic-${String(index).padStart(3, "0")}`
    )
  }

  function buildWithRoutes(count: number): number {
    const directory = project()
    for (const route of routePaths(count)) {
      fs.writeFileSync(
        path.join(directory, `app/routes${route}.md`),
        `---\ntitle: Topic ${route.slice(-3)}\n---\n\n# Topic ${route.slice(-3)}\n`
      )
    }
    const client = build(directory)
    return gzipSync(fs.readFileSync(assetFile(client, "entry-client-"))).length
  }

  it("grows only by the logical paths of added pages", () => {
    const small = buildWithRoutes(routeCount)
    const large = buildWithRoutes(routeCount * 2)
    const pathBytes =
      gzipSync(JSON.stringify(routePaths(routeCount * 2))).length -
      gzipSync(JSON.stringify(routePaths(routeCount))).length
    expect(large - small).toBeLessThanOrEqual(pathBytes + 200)
  }, 360_000)
})
