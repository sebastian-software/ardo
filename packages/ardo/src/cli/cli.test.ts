import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it, vi } from "vitest"

import { isCliEntrypoint, runCli } from "./run"
import type { CliServices } from "./services"
import { createProjectConfigLogger, parseViteArguments, ViteUsageError } from "./vite-command"

function serviceFixture() {
  const stop = vi.fn()
  const services: CliServices = {
    start: vi.fn().mockResolvedValue(stop),
    telemetry: vi.fn().mockResolvedValue({ decision: "declined", collectOptIn: false }),
    checkUpdates: vi.fn().mockResolvedValue({
      latest: "6.1.0",
      newer: true,
      releaseUrl: "https://github.com/sebastian-software/ardo/releases/tag/ardo-v6.1.0",
    }),
  }
  const output: string[] = []
  const stream = {
    write(value: string | Uint8Array) {
      output.push(String(value))
      return true
    },
  }
  return { services, stop, output, options: { services, stdout: stream, stderr: stream } }
}

describe("Ardo CLI", () => {
  it("keeps help, version, invalid commands, and settings help free of reporting", async () => {
    const { services, options } = serviceFixture()
    for (const args of [
      ["--help"],
      ["--version"],
      ["unknown"],
      ["build", "--help"],
      ["telemetry", "--help"],
      ["update-check", "--help"],
    ]) {
      await runCli(args, { ...options, runVite: async () => ({ code: 0 }) })
    }
    expect(services.start).not.toHaveBeenCalled()
    expect(services.telemetry).not.toHaveBeenCalled()
    expect(services.checkUpdates).not.toHaveBeenCalled()
  })

  it("requires explicit informed consent before enabling reporting", async () => {
    const { services, options, output } = serviceFixture()
    expect(await runCli(["telemetry", "enable"], options)).toStrictEqual({ type: "exit", code: 2 })
    expect(services.telemetry).not.toHaveBeenCalled()
    expect(output.join("")).toContain("Reporting is optional")
    expect(await runCli(["telemetry", "enable", "--yes"], options)).toStrictEqual({
      type: "exit",
      code: 0,
    })
    expect(services.telemetry).toHaveBeenCalledWith("enable")
    expect(services.start).not.toHaveBeenCalled()
  })

  it.each(["status", "preview", "disable", "delete"])(
    "routes telemetry %s without collecting another invocation",
    async (action) => {
      const { services, options, output } = serviceFixture()
      expect(await runCli(["telemetry", action], options)).toStrictEqual({ type: "exit", code: 0 })
      expect(services.telemetry).toHaveBeenCalledWith(action)
      expect(JSON.parse(output.join(""))).toStrictEqual({
        decision: "declined",
        collectOptIn: false,
      })
      expect(services.start).not.toHaveBeenCalled()
    }
  )

  it("reports settings failures without changing build exit codes", async () => {
    const { services, options, stop } = serviceFixture()
    vi.mocked(services.telemetry).mockRejectedValue(new Error("unavailable"))
    expect(await runCli(["telemetry", "status"], options)).toStrictEqual({ type: "exit", code: 1 })
    expect(
      await runCli(["build"], { ...options, runVite: async () => ({ code: 7 }) })
    ).toStrictEqual({
      type: "exit",
      code: 7,
    })
    expect(stop).toHaveBeenCalledOnce()
    vi.mocked(services.start).mockRejectedValue(new Error("unavailable"))
    expect(
      await runCli(["build"], { ...options, runVite: async () => ({ code: 0 }) })
    ).toStrictEqual({
      type: "exit",
      code: 0,
    })
  })

  it("cancels advisory work even if the underlying command fails", async () => {
    const { options, stop } = serviceFixture()
    expect(
      await runCli(["dev"], {
        ...options,
        async runVite() {
          throw new Error("failed")
        },
      })
    ).toStrictEqual({ type: "exit", code: 1 })
    expect(stop).toHaveBeenCalledOnce()
  })

  it("checks updates independently of usage reporting", async () => {
    const { services, options, output } = serviceFixture()
    expect(await runCli(["update-check"], options)).toStrictEqual({ type: "exit", code: 0 })
    expect(JSON.parse(output.join("")).latest).toBe("6.1.0")
    expect(services.start).not.toHaveBeenCalled()
    expect(services.telemetry).not.toHaveBeenCalled()
  })

  it.each([["--logLevel", "silent"], ["--logLevel=silent"], ["-l", "silent"]])(
    "suppresses update notices in silent mode: %j",
    async (...flags) => {
      const { services, options } = serviceFixture()
      await runCli(["build", ...flags], { ...options, runVite: async () => ({ code: 0 }) })
      expect(services.start).toHaveBeenCalledWith("build", false)
    }
  )

  it("drops Vite's wrapper-path line when the project config fails to load", () => {
    const wrapper = "/project/node_modules/.ardo/vite-abc123.config.mjs"
    const errors: string[] = []
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "))
    }
    try {
      const logger = createProjectConfigLogger(wrapper)
      logger.error(`failed to load config from ${wrapper}`)
      logger.error('[ardo] Unknown configuration option "Brand".')
    } finally {
      console.error = originalError
    }

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("Unknown configuration option")
  })

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
