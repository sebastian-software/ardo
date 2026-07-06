import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createProjectStructure, upgradeProject } from "./scaffold"
import { formatTargetDir, normalizeTargetDir, toPackageName, validateTargetDir } from "./target-dir"

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

  it("writes package-manager-aware scaffold content", () => {
    createProjectStructure(tmpDir, "minimal", {
      siteTitle: "Docs",
      projectName: "docs-site",
      typedoc: false,
      githubPages: false,
      description: "Built with Ardo",
      packageManager: "bun",
    })

    const gettingStarted = fs.readFileSync(
      path.join(tmpDir, "app", "routes", "guide", "getting-started.mdx"),
      "utf8"
    )
    const packageJson = JSON.parse(fs.readFileSync(path.join(tmpDir, "package.json"), "utf8"))

    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit")
    expect(gettingStarted).toContain("bun run dev")
    expect(gettingStarted).toContain("import { ArdoTip } from")
    expect(fs.existsSync(path.join(tmpDir, "pnpm-workspace.yaml"))).toBe(false)
  })

  it("keeps only the working pnpm build-script allowlist for pnpm scaffolds", () => {
    createProjectStructure(tmpDir, "minimal", {
      siteTitle: "Docs",
      projectName: "docs-site",
      typedoc: false,
      githubPages: false,
      description: "Built with Ardo",
      packageManager: "pnpm",
    })

    const workspace = fs.readFileSync(path.join(tmpDir, "pnpm-workspace.yaml"), "utf8")

    expect(workspace).toContain("allowBuilds:")
    expect(workspace).not.toContain("onlyBuiltDependencies")
  })
})

describe("target directory helpers", () => {
  it("normalizes and validates positional target directories", () => {
    expect(formatTargetDir("docs/site/")).toBe("docs/site")
    expect(normalizeTargetDir("docs/site/")).toBe("docs/site")
    expect(validateTargetDir("docs/site")).toBe(true)
    expect(validateTargetDir("../site")).toContain("parent-directory")
    expect(validateTargetDir("/tmp/site")).toContain("relative path")
  })

  it("derives a safe package name from the target directory basename", () => {
    expect(toPackageName("Docs Site")).toBe("docs-site")
    expect(toPackageName("docs/site")).toBe("site")
    expect(toPackageName(".bad")).toBe("bad")
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
