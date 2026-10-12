import { describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("examples/basic build", () => {
  let buildSucceeded = false

  beforeAll(() => {
    execSync("npx react-router build", {
      cwd: __dirname,
      stdio: "pipe",
      timeout: 120_000,
    })

    buildSucceeded = true
  }, 180_000)

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

  it("generates markdown-features page", () => {
    const mdHtml = path.join(
      __dirname,
      "build",
      "client",
      "guide",
      "markdown-features",
      "index.html"
    )
    expect(fs.existsSync(mdHtml)).toBe(true)
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

  it("publishes one complete, layered stylesheet without component CSS imports", () => {
    const packageDir = path.resolve(__dirname, "../../packages/ardo/dist")
    const files = fs.readdirSync(packageDir, { recursive: true }).map(String)
    expect(files.filter((file) => file.endsWith(".css"))).toEqual([path.join("ui", "styles.css")])
    const css = fs.readFileSync(path.join(packageDir, "ui/styles.css"), "utf8")
    expect(css).toMatch(/^@layer ardo \{/)
    expect(css).toContain("--ardo-color-bg")
    expect(css).toContain("@keyframes")
    for (const file of files.filter((file) => file.endsWith(".js"))) {
      expect(fs.readFileSync(path.join(packageDir, file), "utf8")).not.toMatch(
        /^import\s+["'][^"']+\.css["']/m
      )
    }
  })

  it("emits Ardo styles once in the consumer's root stylesheet", () => {
    const assetsDir = path.join(__dirname, "build/client/assets")
    const stylesheets = fs.readdirSync(assetsDir).filter((file) => file.endsWith(".css"))
    const ardoStylesheets = stylesheets.filter((file) =>
      fs.readFileSync(path.join(assetsDir, file), "utf8").includes("@layer ardo")
    )
    expect(ardoStylesheets).toHaveLength(1)
  })

  it("bundles UI dependencies into the consumer SSR graph", () => {
    const serverDir = path.join(__dirname, "build/server")
    const files = fs.readdirSync(serverDir, { recursive: true }).map(String)
    for (const file of files.filter((file) => file.endsWith(".js"))) {
      expect(fs.readFileSync(path.join(serverDir, file), "utf8")).not.toMatch(
        /^\s*import[^;\n]*from ["'](?:lucide-react|@base-ui\/react)(?:\/[^"']*)?["']/m
      )
    }
  })
})
