import { describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execFileSync, execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function collectFiles(dir: string, ext: string): string[] {
  const results: string[] = []
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (entry.name.endsWith(ext)) results.push(fullPath)
    }
  }
  walk(dir)
  return results
}

describe("examples/library build", () => {
  let buildSucceeded = false

  beforeAll(() => {
    // Generate declarations with the workspace compiler, or the explicitly selected native CLI.
    execFileSync(process.execPath, ["prebuild-declarations.mjs", "--workspace-compiler"], {
      cwd: __dirname,
      stdio: "pipe",
      timeout: 60_000,
    })

    // Run prebuild (TypeDoc generation)
    execSync("node prebuild.mjs", {
      cwd: __dirname,
      stdio: "pipe",
      timeout: 60_000,
    })

    // Run react-router build
    execSync("npx react-router build", {
      cwd: __dirname,
      stdio: "pipe",
      timeout: 120_000,
    })

    buildSucceeded = true
  }, 240_000)

  it("completes build successfully", () => {
    expect(buildSucceeded).toBe(true)
  })

  it("produces build/client/index.html", () => {
    const indexHtml = path.join(__dirname, "build", "client", "index.html")
    expect(fs.existsSync(indexHtml)).toBe(true)
    const content = fs.readFileSync(indexHtml, "utf-8")
    expect(content).toContain("<!DOCTYPE html>")
  })

  it("generates getting-started page", () => {
    const gsHtml = path.join(__dirname, "build", "client", "guide", "getting-started", "index.html")
    expect(fs.existsSync(gsHtml)).toBe(true)
  })

  it("generates TypeDoc API markdown in app/routes", () => {
    const apiContentDir = path.join(__dirname, "app", "routes", "api-reference")
    expect(fs.existsSync(apiContentDir)).toBe(true)
    const mdFiles = collectFiles(apiContentDir, ".md")
    expect(mdFiles.length).toBeGreaterThan(0)
  })

  it("generates TypeDoc API HTML pages in build", () => {
    const apiDistDir = path.join(__dirname, "build", "client", "api-reference")
    expect(fs.existsSync(apiDistDir)).toBe(true)
    const htmlFiles = collectFiles(apiDistDir, ".html")
    expect(htmlFiles.length).toBeGreaterThan(0)
  })

  it("prerenders every declaration page, including callable types and overload documentation", () => {
    const markdownDir = path.join(__dirname, "app", "routes", "api-declarations")
    const htmlDir = path.join(__dirname, "build", "client", "api-declarations")
    const pages = collectFiles(markdownDir, ".md")
    expect(pages).toHaveLength(12)
    for (const page of pages) {
      expect(fs.readFileSync(page, "utf8"), page).not.toContain("Additional members may be defined")
      const route = path.relative(markdownDir, page).replace(/\.md$/u, "")
      const html = route === "index" ? "index.html" : path.join(route, "index.html")
      expect(fs.existsSync(path.join(htmlDir, html)), route).toBe(true)
    }
    const renderer = fs.readFileSync(
      path.join(htmlDir, "types", "documentrenderer", "index.html"),
      "utf8"
    )
    expect(renderer).toContain("The document source")
    expect(renderer).toContain("Optional rendering configuration")
    expect(renderer).toContain("The rendered document")
    const reader = fs.readFileSync(
      path.join(htmlDir, "interfaces", "documentreader", "index.html"),
      "utf8"
    )
    expect(reader).toContain("Reads a single document.")
    expect(reader).toContain("Reads several documents in order.")
    expect(reader).toContain("The document sources")
  })

  it("renders inherited component options and their documentation", () => {
    const panel = fs.readFileSync(
      path.join(
        __dirname,
        "build",
        "client",
        "api-declarations",
        "components",
        "documentationpanel",
        "index.html"
      ),
      "utf8"
    )
    expect(panel).toContain("Whether to use uppercase")
    expect(panel).toContain("Custom separator character")
    expect(panel).toContain("Ordered plugins used while rendering a page.")
    expect(panel).toContain("Sections included in the page.")
  })

  it("preserves readonly dictionaries, unions, and indexed leaf expressions in rendered docs", () => {
    const directory = path.join(__dirname, "build", "client", "api-declarations", "interfaces")
    const metadata = fs.readFileSync(path.join(directory, "pagemetadata", "index.html"), "utf8")
    expect(metadata).toContain("Index signatures")
    expect(metadata).toContain("unknown")
    const result = fs.readFileSync(path.join(directory, "renderresult", "index.html"), "utf8")
    expect(result).toContain("Successful content or a failure message.")
    expect(result).toContain("PageMetadata")
    expect(result).toContain("failed")
    expect(result).toContain("ready")
  })

  it("uses package name instead of 'index' for src/index.ts modules (#54)", () => {
    // Regression test: TypeDoc should resolve the module name from package.json
    // instead of using the literal filename "index" for src/index.ts entry points.
    const apiIndexMd = path.join(__dirname, "app", "routes", "api-reference", "index.md")
    expect(fs.existsSync(apiIndexMd)).toBe(true)
    const content = fs.readFileSync(apiIndexMd, "utf-8")

    // Should contain the package name as module name
    expect(content).toContain("ardo-example-library")

    // Should NOT contain "index" as a standalone module name in links
    expect(content).not.toMatch(/\[index\]\(/)
  })

  it("includes JS and CSS assets", () => {
    const assetsDir = path.join(__dirname, "build", "client", "assets")
    expect(fs.existsSync(assetsDir)).toBe(true)

    const files = fs.readdirSync(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith(".js"))
    const cssFiles = files.filter((f) => f.endsWith(".css"))
    expect(jsFiles.length).toBeGreaterThan(0)
    expect(cssFiles.length).toBeGreaterThan(0)
  })
})
