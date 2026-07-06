import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { main } from "./index"

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-cli-"))
  vi.spyOn(console, "log").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(tmpDir, { force: true, recursive: true })
})

describe("main", () => {
  it("scaffolds without prompts in non-interactive mode", async () => {
    await main(["Docs Site", "minimal", "--yes", "--title", "CLI Docs", "--no-github-pages"], {
      cwd: tmpDir,
      env: { npm_config_user_agent: "npm/11.0.0" },
      stdinIsTTY: false,
    })

    const root = path.join(tmpDir, "Docs Site")
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
    const viteConfig = fs.readFileSync(path.join(root, "vite.config.ts"), "utf8")
    const gettingStarted = fs.readFileSync(
      path.join(root, "app", "routes", "guide", "getting-started.mdx"),
      "utf8"
    )

    expect(pkg.name).toBe("docs-site")
    expect(fs.existsSync(path.join(root, "pnpm-workspace.yaml"))).toBe(false)
    expect(viteConfig).toContain("title: 'CLI Docs'")
    expect(viteConfig).toContain("githubPages: false")
    expect(gettingStarted).toContain("npm run dev")
  })
})
