import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createTestProject } from "./project"

describe("the public Basic example", () => {
  const directory = createTestProject()
  const client = path.join(directory, "build/client")

  beforeAll(() => {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "tsc", "--noEmit"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 60_000,
    })
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "build"], {
      cwd: directory,
      stdio: "pipe",
      timeout: 120_000,
    })
  }, 180_000)

  afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))

  it("prerenders the home page and a simple React component", () => {
    const html = fs.readFileSync(path.join(client, "index.html"), "utf8")
    expect(html).toContain("<!DOCTYPE html>")
    expect(html.replace(/<!--.*?-->/gs, "")).toContain("Count: 0")
  })

  it.each(["getting-started", "markdown-features"])("prerenders the authored %s guide", (route) => {
    expect(fs.existsSync(path.join(client, "guide", route, "index.html"))).toBe(true)
  })

  it("includes JavaScript and CSS assets", () => {
    const files = fs.readdirSync(path.join(client, "assets"))
    expect(files.some((file) => file.endsWith(".js"))).toBe(true)
    expect(files.some((file) => file.endsWith(".css"))).toBe(true)
  })

  it("loads React from its own chunk", () => {
    expect(readEagerScripts().some((file) => /^react-[\w-]+\.js$/u.test(file))).toBe(true)
  })

  /** Scripts the home page loads or preloads before anyone interacts with it. */
  function readEagerScripts(): string[] {
    const html = fs.readFileSync(path.join(client, "index.html"), "utf8")
    return [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/gu)].map(
      (match) => match[1] ?? ""
    )
  }
})
