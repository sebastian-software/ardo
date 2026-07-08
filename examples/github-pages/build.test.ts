import { describe, it, expect, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildClientDir = path.join(__dirname, "build", "client")

describe("examples/github-pages build", () => {
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

  it("flattens prerendered pages to the GitHub Pages artifact root", () => {
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

    expect(indexHtml).toContain('href="/ardo/guide/getting-started"')
    expect(indexHtml).toContain('href="/ardo/assets/')
    expect(indexHtml).toContain('import "/ardo/assets/')
    expect(indexHtml).not.toContain('href="/assets/')
    expect(indexHtml).not.toContain('import "/assets/')
  })
})
