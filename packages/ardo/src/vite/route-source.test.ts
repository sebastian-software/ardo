import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { createRoutesModule } from "./routes-plugin"

let directory: string | undefined
afterEach(() => {
  if (directory != null) fs.rmSync(directory, { recursive: true, force: true })
})

describe("route source metadata", () => {
  it("uses source-relative paths and commit dates, with file times for untracked pages", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-route-source-"))
    const routesDir = path.join(directory, "app/routes")
    fs.mkdirSync(path.join(routesDir, "guide"), { recursive: true })
    const source = path.join(routesDir, "guide/setup.mdx")
    fs.writeFileSync(source, "# Setup")
    const git = (args: string[]) =>
      execFileSync("git", args, {
        cwd: directory,
        stdio: "ignore",
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: "2020-01-02T03:04:05Z",
          GIT_COMMITTER_DATE: "2020-01-02T03:04:05Z",
        },
      })
    git(["init", "--quiet"])
    git(["add", "."])
    git([
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--quiet",
      "-m",
      "Initial docs",
    ])
    fs.writeFileSync(path.join(routesDir, "home.md"), "# Home")
    const code = createRoutesModule({ root: directory, routesDir })
    expect(code).toContain('"relativePath":"guide/setup.mdx","lastUpdated":1577934245000')
    expect(code).toContain('"relativePath":"home.md","lastUpdated":')
    expect(code).not.toContain(`"relativePath":"${directory}`)
  })
})
