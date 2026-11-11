import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, expect, it } from "vitest"
import { createTestProject } from "./project"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

function build(directory: string, env: NodeJS.ProcessEnv = {}): void {
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    env: { ...process.env, ...env },
    stdio: "pipe",
    timeout: 120_000,
  })
}

function files(directory: string): Map<string, Buffer> {
  const result = new Map<string, Buffer>()
  for (const entry of fs.readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const file = path.join(entry.parentPath, entry.name)
    result.set(path.relative(directory, file), fs.readFileSync(file))
  }
  return result
}

it("reuses cached routes and images with byte-identical output, and prunes stale entries", () => {
  const directory = fs.realpathSync(createTestProject("publication"))
  directories.push(directory)
  const config = path.join(directory, "ardo.config.ts")
  fs.writeFileSync(
    config,
    fs
      .readFileSync(config, "utf8")
      .replace(
        'title: "Publication example",',
        'title: "Publication example",\n  buildTime: "2026-11-11T00:00:00Z",'
      )
  )
  const cache = path.join(directory, "node_modules/.cache/ardo")
  const output = path.join(directory, "build/client")

  build(directory, { ARDO_CACHE: "false" })
  expect(fs.existsSync(cache)).toBe(false)
  const uncached = files(output)

  build(directory)
  for (const namespace of ["compiled-route", "images", "route-metadata"])
    expect(fs.readdirSync(path.join(cache, namespace)).length).toBeGreaterThan(0)
  const stale = path.join(cache, "route-metadata/stale.json")
  fs.writeFileSync(stale, "{}")

  build(directory)
  expect(fs.existsSync(stale)).toBe(false)
  expect(files(output)).toStrictEqual(uncached)
})
