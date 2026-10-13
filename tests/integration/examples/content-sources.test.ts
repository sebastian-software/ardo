import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { createTestProject } from "./project"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

const directory = createTestProject("content-sources")
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))

describe("content-sources fixture build", () => {
  beforeAll(() => {
    execSync("pnpm --config.verifyDepsBeforeRun=false exec ardo build", {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  }, 180_000)

  it("materializes the external collection as a static route", () => {
    expect(fs.existsSync(path.join(directory, "build/client/recipes/quickstart/index.html"))).toBe(
      true
    )
  })

  it("prerenders the custom route that consumes virtual collection data", () => {
    const catalog = fs.readFileSync(path.join(directory, "build/client/catalog/index.html"), "utf8")
    expect(catalog).toContain("Quickstart recipe")
  })
})
