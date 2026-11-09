import { afterAll, describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { createTestProject } from "./project"

const directory = createTestProject("client-recovery", { replaceRoutes: true })
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))
const build = () =>
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
const route = path.join(directory, "app/routes/en/home.tsx")
const original = fs.readFileSync(route, "utf8")

describe("client recovery does not conceal static generation failures", () => {
  it("still builds a branded missing-page response", () => {
    build()
    const html = fs.readFileSync(path.join(directory, "build/client/404.html"), "utf8")
    expect(html).toContain("Custom missing page")
    expect(html).not.toContain("data-ardo-recovery")
  })
  for (const [phase, source] of [
    [
      "module",
      'throw new Error("Static module failure"); export default function Page() { return null }',
    ],
    [
      "metadata",
      'export function meta() { throw new Error("Static metadata failure") }; export default function Page() { return null }',
    ],
    ["render", 'export default function Page() { throw new Error("Static render failure") }'],
  ]) {
    it(`fails the build on a static ${phase} error`, () => {
      fs.writeFileSync(route, source)
      try {
        expect(build).toThrow()
      } finally {
        fs.writeFileSync(route, original)
      }
    })
  }
})
