import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"

import { isCliEntrypoint, runCli } from "./run"
import { parseViteArguments, ViteUsageError } from "./vite-command"

describe("Ardo CLI", () => {
  it("prints help and version without resolving a framework command", async () => {
    let help = ""
    let version = ""

    const helpOutcome = await runCli(["--help"], {
      stdout: {
        write(value) {
          help += typeof value === "string" ? value : Buffer.from(value).toString()
          return true
        },
      },
    })
    const versionOutcome = await runCli(["--version"], {
      stdout: {
        write(value) {
          version += typeof value === "string" ? value : Buffer.from(value).toString()
          return true
        },
      },
    })

    expect(helpOutcome).toStrictEqual({ type: "exit", code: 0 })
    expect(help).toContain("Usage: ardo <command>")
    expect(versionOutcome).toStrictEqual({ type: "exit", code: 0 })
    expect(version.trim()).toMatch(/^\d+\.\d+\.\d+/u)
  })

  it("hands build and dev to Vite with the parsed root and options", async () => {
    const calls: Array<{ command: string; args: readonly string[]; cwd: string }> = []
    const outcome = await runCli(["build", "docs", "--mode", "staging"], {
      cwd: "/work",
      async runVite(command, args, options) {
        calls.push({ command, args, cwd: options.cwd })
        return { code: 0 }
      },
    })

    expect(outcome).toStrictEqual({ type: "exit", code: 0 })
    expect(calls).toStrictEqual([
      { command: "build", args: ["docs", "--mode", "staging"], cwd: "/work" },
    ])
  })

  it("reports a failed build and a usage error with distinct exit codes", async () => {
    let stderr = ""
    const streams = {
      stderr: {
        write(value: string | Uint8Array) {
          stderr += typeof value === "string" ? value : Buffer.from(value).toString()
          return true
        },
      },
    }
    const failed = await runCli(["build"], {
      ...streams,
      async runVite() {
        throw new Error("render failed")
      },
    })
    const usage = await runCli(["dev", "--port", "nope"], streams)

    expect(failed).toStrictEqual({ type: "exit", code: 1 })
    expect(usage).toStrictEqual({ type: "exit", code: 2 })
    expect(stderr).toContain("Ardo build failed: render failed")
    expect(stderr).toContain("Ardo dev failed: Invalid port: nope")
  })

  it("parses dev and build options into Vite's inline config", () => {
    expect(
      parseViteArguments(
        "dev",
        ["site", "--host", "--port", "3000", "--open", "/guide", "--force"],
        "/work"
      )
    ).toStrictEqual({
      root: path.resolve("/work", "site"),
      config: undefined,
      help: false,
      inline: {
        optimizeDeps: { force: true },
        server: { host: true, port: 3000, open: "/guide" },
      },
    })
    expect(
      parseViteArguments("build", ["-c", "vite.custom.ts", "--no-minify", "-l", "warn"], "/work")
    ).toStrictEqual({
      root: "/work",
      config: "vite.custom.ts",
      help: false,
      inline: { logLevel: "warn", build: { minify: false } },
    })
    expect(() => parseViteArguments("build", ["--port", "1"], "/work")).toThrow(ViteUsageError)
    expect(() => parseViteArguments("build", ["a", "b"], "/work")).toThrow(
      "at most one project root"
    )
  })

  it("recognizes the executable even when invoked through a symlink", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-cli-entry-"))
    const target = path.join(root, "cli.js")
    const link = path.join(root, "ardo")

    try {
      await writeFile(target, "")
      await symlink(target, link)

      expect(isCliEntrypoint(pathToFileURL(target).href, link)).toBe(true)
      expect(isCliEntrypoint(pathToFileURL(target).href, undefined)).toBe(false)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
