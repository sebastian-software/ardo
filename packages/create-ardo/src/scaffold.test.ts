import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createProjectStructure, upgradeProject } from "./scaffold"

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-scaffold-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { force: true, recursive: true })
})

describe("createProjectStructure", () => {
  it("escapes prompt values before writing TypeScript and JSON templates", () => {
    createProjectStructure(tmpDir, "minimal", {
      siteTitle: `It's a "test" & more`,
      projectName: "test-project",
      typedoc: false,
      githubPages: false,
      description: `Bob's "docs"`,
    })

    const viteConfig = fs.readFileSync(path.join(tmpDir, "vite.config.ts"), "utf8")
    const homeRoute = fs.readFileSync(path.join(tmpDir, "app", "routes", "home.tsx"), "utf8")
    const packageJson = JSON.parse(fs.readFileSync(path.join(tmpDir, "package.json"), "utf8"))

    expect(viteConfig).toContain(`title: 'It\\'s a \\"test\\" & more'`)
    expect(viteConfig).toContain(`description: 'Bob\\'s \\"docs\\"'`)
    expect(homeRoute).toContain(`{ title: "It\\'s a \\"test\\" & more" }`)
    expect(packageJson.name).toBe("test-project")
  })

  it("does not overwrite existing files when overwriteExisting is false", () => {
    fs.mkdirSync(path.join(tmpDir, "app"), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, "package.json"), '{"name":"keep-me"}\n')
    fs.writeFileSync(path.join(tmpDir, "app", "root.tsx"), "// customized\n")

    createProjectStructure(tmpDir, "minimal", {
      siteTitle: "Docs",
      projectName: "test-project",
      typedoc: false,
      githubPages: false,
      description: "Built with Ardo",
      overwriteExisting: false,
    })

    expect(fs.readFileSync(path.join(tmpDir, "package.json"), "utf8")).toBe('{"name":"keep-me"}\n')
    expect(fs.readFileSync(path.join(tmpDir, "app", "root.tsx"), "utf8")).toBe("// customized\n")
    expect(fs.existsSync(path.join(tmpDir, "vite.config.ts"))).toBe(true)
  })
})

describe("upgradeProject", () => {
  it("skips customized skeleton files instead of overwriting them", () => {
    createProjectStructure(tmpDir, "minimal", {
      siteTitle: "Docs",
      projectName: "test-project",
      typedoc: false,
      githubPages: false,
      description: "Built with Ardo",
    })
    fs.writeFileSync(path.join(tmpDir, "app", "root.tsx"), "// user customization\n")

    const result = upgradeProject(tmpDir)

    expect(fs.readFileSync(path.join(tmpDir, "app", "root.tsx"), "utf8")).toBe(
      "// user customization\n"
    )
    expect(result.skipped).toContain("app/root.tsx (customized)")
  })
})
