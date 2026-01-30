import { describe, it, expect, beforeAll, afterAll } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { createProjectStructure } from "./scaffold"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ardoPackageDir = path.resolve(__dirname, "..", "..", "ardo")

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

describe("scaffold integration build", () => {
  let tmpDir: string
  let buildSucceeded = false

  beforeAll(async () => {
    // 1. Create temp directory
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-integration-"))

    // 2. Scaffold project (typedoc: false because we run it separately before build)
    createProjectStructure(tmpDir, "minimal", {
      siteTitle: "Integration Test Docs",
      projectName: "test-project",
      typedoc: false,
      githubPages: false,
    })

    // 3. Add pseudo API source for TypeDoc testing (src/index.ts is the default entry point)
    const srcDir = path.join(tmpDir, "src")
    fs.mkdirSync(srcDir, { recursive: true })

    fs.writeFileSync(
      path.join(srcDir, "index.ts"),
      `/**
 * Adds two numbers together.
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Configuration options for the greeter.
 */
export interface GreeterConfig {
  /** The greeting prefix */
  prefix: string
  /** Whether to use uppercase */
  uppercase?: boolean
}

/**
 * Creates a greeting message.
 * @param name - The name to greet
 * @param config - Optional configuration
 * @returns The greeting string
 */
export function greet(name: string, config?: GreeterConfig): string {
  const prefix = config?.prefix ?? 'Hello'
  const message = \`\${prefix}, \${name}!\`
  return config?.uppercase ? message.toUpperCase() : message
}
`
    )

    // 4. Add tsconfig for the API source (separate from main tsconfig to avoid route compilation errors)
    fs.writeFileSync(
      path.join(tmpDir, "tsconfig.api.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "bundler",
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
          include: ["src/index.ts"],
        },
        null,
        2
      )
    )

    // 5. Patch package.json — use local ardo (wildcard deps resolve via ardo)
    const pkgPath = path.join(tmpDir, "package.json")
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
    pkg.dependencies.ardo = `file:${ardoPackageDir}`
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

    // 6. Write prebuild script — generates TypeDoc API docs before vite build
    // Note: TypeDoc must run BEFORE vite build so React Router can discover the routes
    fs.writeFileSync(
      path.join(tmpDir, "prebuild.mjs"),
      `import { generateApiDocs } from 'ardo/typedoc'

await generateApiDocs({
  enabled: true,
  entryPoints: ['./src/index.ts'],
  tsconfig: './tsconfig.api.json',
  out: 'api-reference',
}, './app/routes')
`
    )

    // 7. Install dependencies
    execSync("pnpm install --no-lockfile", {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 120_000,
    })

    // 8. Generate TypeDoc API docs (before vite build so routes plugin picks them up)
    execSync("node prebuild.mjs", {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 60_000,
    })

    // 9. Build with react-router (handles client, server, and prerender)
    execSync("npx react-router build", {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 120_000,
    })

    buildSucceeded = true
  }, 300_000)

  afterAll(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("completes build successfully", () => {
    expect(buildSucceeded).toBe(true)
  })

  it("produces build/client directory", () => {
    expect(fs.existsSync(path.join(tmpDir, "build", "client"))).toBe(true)
  })

  it("generates home page with site title", () => {
    const indexHtml = path.join(tmpDir, "build", "client", "index.html")
    expect(fs.existsSync(indexHtml)).toBe(true)
    const content = fs.readFileSync(indexHtml, "utf-8")
    expect(content).toContain("<!DOCTYPE html>")
    expect(content).toContain("Integration Test Docs")
  })

  it("generates getting-started page", () => {
    const gsHtml = path.join(tmpDir, "build", "client", "guide", "getting-started", "index.html")
    expect(fs.existsSync(gsHtml)).toBe(true)
    const content = fs.readFileSync(gsHtml, "utf-8")
    expect(content).toContain("<!DOCTYPE html>")
  })

  it("generates TypeDoc API markdown in app/routes directory", () => {
    const apiContentDir = path.join(tmpDir, "app", "routes", "api-reference")
    expect(fs.existsSync(apiContentDir)).toBe(true)
    const mdFiles = collectFiles(apiContentDir, ".md")
    expect(mdFiles.length).toBeGreaterThan(0)
  })

  it("generates TypeDoc API HTML pages in build", () => {
    const apiDistDir = path.join(tmpDir, "build", "client", "api-reference")
    expect(fs.existsSync(apiDistDir)).toBe(true)
    const htmlFiles = collectFiles(apiDistDir, ".html")
    expect(htmlFiles.length).toBeGreaterThan(0)
  })

  it("includes JS and CSS assets", () => {
    const assetsDir = path.join(tmpDir, "build", "client", "assets")
    expect(fs.existsSync(assetsDir)).toBe(true)

    const files = fs.readdirSync(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith(".js"))
    const cssFiles = files.filter((f) => f.endsWith(".css"))
    expect(jsFiles.length).toBeGreaterThan(0)
    expect(cssFiles.length).toBeGreaterThan(0)
  })
})
