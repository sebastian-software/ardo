import { describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
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

describe("examples/monorepo build", () => {
  let buildSucceeded = false

  beforeAll(() => {
    // Run prebuild (TypeDoc generation for both packages)
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

  it("generates alpha API markdown in app/routes", () => {
    const alphaDir = path.join(__dirname, "app", "routes", "api-reference", "alpha")
    expect(fs.existsSync(alphaDir)).toBe(true)
    const mdFiles = collectFiles(alphaDir, ".md")
    expect(mdFiles.length).toBeGreaterThan(0)
  })

  it("generates beta API markdown in app/routes", () => {
    const betaDir = path.join(__dirname, "app", "routes", "api-reference", "beta")
    expect(fs.existsSync(betaDir)).toBe(true)
    const mdFiles = collectFiles(betaDir, ".md")
    expect(mdFiles.length).toBeGreaterThan(0)
  })

  it("generates alpha API HTML pages in build", () => {
    const alphaDistDir = path.join(__dirname, "build", "client", "api-reference", "alpha")
    expect(fs.existsSync(alphaDistDir)).toBe(true)
    const htmlFiles = collectFiles(alphaDistDir, ".html")
    expect(htmlFiles.length).toBeGreaterThan(0)
  })

  it("generates beta API HTML pages in build", () => {
    const betaDistDir = path.join(__dirname, "build", "client", "api-reference", "beta")
    expect(fs.existsSync(betaDistDir)).toBe(true)
    const htmlFiles = collectFiles(betaDistDir, ".html")
    expect(htmlFiles.length).toBeGreaterThan(0)
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
