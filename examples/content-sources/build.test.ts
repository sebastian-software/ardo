import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { beforeAll, describe, expect, it } from "vitest"

const directory = path.dirname(fileURLToPath(import.meta.url))

describe("examples/content-sources build", () => {
  beforeAll(() => {
    execSync("npx react-router build", { cwd: directory, stdio: "pipe", timeout: 120_000 })
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
