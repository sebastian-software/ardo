import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createTestProject } from "./project"

describe("sitemap exclusions", () => {
  const directory = createTestProject("sitemap")
  const client = path.join(directory, "build/client")

  beforeAll(() => {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  }, 180_000)

  afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))

  it("omits an excluded TSX route while retaining sibling routes and the page itself", () => {
    const sitemap = fs.readFileSync(path.join(client, "sitemap.xml"), "utf8")
    expect(sitemap).not.toContain("/kit</loc>")
    expect(sitemap).toContain("/kitchen</loc>")
    expect(fs.existsSync(path.join(client, "kit/index.html"))).toBe(true)
  })
})
