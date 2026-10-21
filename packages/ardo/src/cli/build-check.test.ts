import { existsSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { LinkCheckConfig } from "../config/types"

import { ARDO_BUILD_INFO_ENV } from "../vite/build-info"
import { runCli } from "./run"

let clientDir: string

beforeEach(async () => {
  clientDir = await mkdtemp(path.join(tmpdir(), "ardo-build-check-"))
  await writeFile(
    path.join(clientDir, "index.html"),
    '<a href="/guide/">ok</a><a href="/gone/">x</a>'
  )
  await mkdir(path.join(clientDir, "guide"))
  await writeFile(path.join(clientDir, "guide/index.html"), '<a href="/">home</a>')
})

afterEach(async () => {
  await rm(clientDir, { recursive: true, force: true })
})

function captured() {
  const output = { stdout: "", stderr: "" }
  return {
    output,
    stdout: {
      write(chunk: string) {
        output.stdout += chunk
        return true
      },
    },
    stderr: {
      write(chunk: string) {
        output.stderr += chunk
        return true
      },
    },
  }
}

async function build(linkCheck: LinkCheckConfig, code = 0) {
  const streams = captured()
  let infoFile: string | undefined
  const outcome = await runCli(["build"], {
    ...streams,
    async runReactRouter(_command, _args, options) {
      infoFile = options.env?.[ARDO_BUILD_INFO_ENV]
      if (infoFile != null) {
        await writeFile(infoFile, JSON.stringify({ base: "/", clientDir, linkCheck }))
      }
      return { code, signal: null }
    },
  })
  return { outcome, infoFile, ...streams.output }
}

describe("ardo build link check", () => {
  it("warns about broken internal links in the finished output by default", async () => {
    const result = await build({})

    expect(result.outcome).toStrictEqual({ type: "exit", code: 0 })
    expect(result.stderr).toContain("1 broken internal link in build output")
    expect(result.stderr).toContain("    /gone/: Missing target")
    // The handover file lives only for the duration of the build.
    expect(result.infoFile).toStrictEqual(expect.any(String))
    expect(existsSync(String(result.infoFile))).toBe(false)
  })

  it("fails the build when the level is error", async () => {
    const result = await build({ level: "error" })

    expect(result.outcome).toStrictEqual({ type: "exit", code: 1 })
  })

  it("reports a clean output and honors exclusions", async () => {
    const result = await build({ level: "error", exclude: ["/gone/"] })

    expect(result.outcome).toStrictEqual({ type: "exit", code: 0 })
    expect(result.stdout).toContain("[ardo] Checked 3 internal links in 2 pages.")
  })

  it("skips the check when disabled or when the build failed", async () => {
    const disabled = await build({ enabled: false, level: "error" })
    const failed = await build({ level: "error" }, 2)

    expect(disabled.outcome).toStrictEqual({ type: "exit", code: 0 })
    expect(disabled.stderr).toBe("")
    expect(failed.outcome).toStrictEqual({ type: "exit", code: 2 })
    expect(failed.stderr).toBe("")
  })
})
