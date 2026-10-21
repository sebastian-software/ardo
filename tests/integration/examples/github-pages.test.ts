import { afterAll, describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { createTestProject } from "./project"

const __dirname = createTestProject("github-pages")
afterAll(() => fs.rmSync(__dirname, { recursive: true, force: true }))
const buildClientDir = path.join(__dirname, "build", "client")

describe("github-pages fixture build", () => {
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

  it("writes prerendered pages at the GitHub Pages artifact root", () => {
    expect(fs.existsSync(path.join(buildClientDir, "index.html"))).toBe(true)
    expect(fs.existsSync(path.join(buildClientDir, "guide", "getting-started", "index.html"))).toBe(
      true
    )
    expect(
      fs.existsSync(path.join(buildClientDir, "guide", "markdown-features", "index.html"))
    ).toBe(true)
    expect(fs.existsSync(path.join(buildClientDir, "ardo"))).toBe(false)
  })

  it("keeps GitHub Pages basename in generated links and asset references", () => {
    const indexHtml = fs.readFileSync(path.join(buildClientDir, "index.html"), "utf8")

    expect(indexHtml).toContain('href="/ardo/guide/getting-started/"')
    expect(indexHtml).toContain('href="/ardo/assets/')
    expect(indexHtml).toContain('src="/ardo/assets/')
    expect(indexHtml).not.toContain('href="/assets/')
    expect(indexHtml).not.toContain('src="/assets/')
  })
})
