import { afterAll, describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { createTestProject, repositoryRoot } from "./project"
import { assertDevSSR } from "./dev-server"

const __dirname = createTestProject("runtime")
afterAll(() => fs.rmSync(__dirname, { recursive: true, force: true }))

describe("runtime and bare-layout regression build", () => {
  let buildSucceeded = false

  beforeAll(() => {
    execSync("pnpm --config.verifyDepsBeforeRun=false exec ardo build", {
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
    expect(content).toContain('data-testid="runtime-counter"')
    expect(content.replace(/<!--.*?-->/gs, "")).toContain("Count: 0")
  })

  it("generates getting-started page", () => {
    const gsHtml = path.join(__dirname, "build", "client", "guide", "getting-started", "index.html")
    expect(fs.existsSync(gsHtml)).toBe(true)
  })

  it("includes JS and CSS assets", () => {
    const assetsDir = path.join(__dirname, "build", "client", "assets")
    expect(fs.existsSync(assetsDir)).toBe(true)

    const files = fs.readdirSync(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith(".js"))
    const cssFiles = files.filter((f) => f.endsWith(".css"))
    expect(jsFiles.length).toBeGreaterThan(0)
    expect(cssFiles.length).toBeGreaterThan(0)
    expect(
      jsFiles.some((file) =>
        fs.readFileSync(path.join(assetsDir, file), "utf-8").includes("runtime-counter")
      )
    ).toBe(true)
  })

  it("prerenders a plain bare route with only its own chrome and skip link", () => {
    const html = fs.readFileSync(path.join(__dirname, "build/client/bare/index.html"), "utf8")
    expect(html).toContain('<main id="main-content">')
    expect(html).toContain('href="#bare-content"')
    expect(html).not.toContain('href="#main-content"')
    expect(html).not.toContain('class="ardo-header ')
    expect(html).not.toContain('class="ardo-footer ')
  })

  it("publishes one complete, layered stylesheet without component CSS imports", () => {
    const packageDir = path.join(repositoryRoot, "packages/ardo/dist")
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

  it("bundles components and their runtime into the consumer SSR graph", () => {
    const serverDir = path.join(__dirname, "build/server")
    const files = fs.readdirSync(serverDir, { recursive: true }).map(String)
    for (const file of files.filter((file) => file.endsWith(".js"))) {
      expect(fs.readFileSync(path.join(serverDir, file), "utf8")).not.toMatch(
        /^\s*import[^;\n]*from ["'](?:react(?:-dom|-router)?|lucide-react|@base-ui\/react)(?:\/[^"']*)?["']/m
      )
    }
  })

  it("renders the first development SSR request with bundled CommonJS dependencies", async () => {
    await assertDevSSR(__dirname, { title: "Ardo Basic Example" })
  }, 120_000)
})
