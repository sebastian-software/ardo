import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"

import { resolveReactRouterBin, runReactRouterCommand } from "./process"
import { isCliEntrypoint, runCli } from "./run"

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

  it("resolves React Router's public bin and preserves forwarded args, cwd, and exit status", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-cli-process-"))
    const binPath = path.join(root, "react-router.cjs")
    const capturePath = path.join(root, "captured.json")
    const wrapperPath = path.join(root, ".ardo", "vite.config.ts")
    let preparedProject: { root: string; config?: string } | undefined

    try {
      await writeFile(
        binPath,
        [
          'const fs = require("node:fs")',
          "const args = process.argv.slice(2)",
          `fs.writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify({ cwd: process.cwd(), args }))`,
          "process.exitCode = 17",
        ].join("\n")
      )

      expect(path.isAbsolute(resolveReactRouterBin())).toBe(true)
      const childExit = await runReactRouterCommand(
        "dev",
        [
          "--host",
          "0.0.0.0",
          "--port",
          "4040",
          "--mode",
          "production",
          "./site",
          "-c=vite.config.ts",
        ],
        {
          cwd: root,
          binPath,
          prepareProjectConfig(projectRoot, explicitVitePath) {
            preparedProject = { root: projectRoot, config: explicitVitePath }
            return wrapperPath
          },
        }
      )
      const captured = parseCapturedProcess(await readFile(capturePath, "utf8"))

      expect(childExit).toStrictEqual({ code: 17, signal: null })
      expect(preparedProject).toStrictEqual({
        root: path.resolve(root, "site"),
        config: path.resolve(root, "site", "vite.config.ts"),
      })
      expect(captured).toStrictEqual({
        cwd: await realpath(root),
        args: [
          "dev",
          "--host",
          "0.0.0.0",
          "--port",
          "4040",
          "--mode",
          "production",
          path.resolve(root, "site"),
          "--config",
          wrapperPath,
        ],
      })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("forwards the selected project root when no positional root is supplied", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-cli-default-root-"))
    const binPath = path.join(root, "react-router.cjs")
    const capturePath = path.join(root, "captured.json")
    const wrapperPath = path.join(root, ".ardo", "vite.config.ts")

    try {
      await writeFile(
        binPath,
        [
          'const fs = require("node:fs")',
          `fs.writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify(process.argv.slice(2)))`,
        ].join("\n")
      )

      const childExit = await runReactRouterCommand("dev", ["--host", "localhost"], {
        cwd: root,
        binPath,
        prepareProjectConfig() {
          return wrapperPath
        },
      })

      expect(childExit).toStrictEqual({ code: 0, signal: null })
      expect(JSON.parse(await readFile(capturePath, "utf8"))).toStrictEqual([
        "dev",
        path.resolve(root),
        "--host",
        "localhost",
        "--config",
        wrapperPath,
      ])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("does not prepare an Ardo wrapper for React Router help or version", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-cli-help-"))
    const binPath = path.join(root, "react-router.cjs")
    const capturePath = path.join(root, "captured.json")

    try {
      await writeFile(
        binPath,
        [
          'const fs = require("node:fs")',
          `fs.writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify(process.argv.slice(2)))`,
        ].join("\n")
      )
      const result = await runReactRouterCommand("dev", ["--help"], {
        cwd: root,
        binPath,
        prepareProjectConfig() {
          throw new Error("help must not prepare project config")
        },
      })

      expect(result).toStrictEqual({ code: 0, signal: null })
      expect(JSON.parse(await readFile(capturePath, "utf8"))).toStrictEqual(["dev", "--help"])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("forwards and preserves a child process signal", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-cli-signal-"))
    const binPath = path.join(root, "react-router.cjs")
    const signalListeners = new Map<NodeJS.Signals, () => void>()
    let resolveSignalReady: (() => void) | undefined
    const signalReady = new Promise<void>((resolve) => {
      resolveSignalReady = resolve
    })
    const signalTarget = {
      on(signal: NodeJS.Signals, listener: () => void) {
        signalListeners.set(signal, listener)
        if (signal === "SIGTERM") resolveSignalReady?.()
      },
      off(signal: NodeJS.Signals, listener: () => void) {
        if (signalListeners.get(signal) === listener) signalListeners.delete(signal)
      },
    }

    try {
      await writeFile(binPath, "setInterval(() => {}, 1000)\n")
      const running = runReactRouterCommand("build", [], {
        cwd: root,
        binPath,
        signalTarget,
        prepareProjectConfig() {
          return path.join(root, "vite.config.ts")
        },
      })
      await signalReady
      signalListeners.get("SIGTERM")?.()

      expect(await running).toStrictEqual({ code: null, signal: "SIGTERM" })
      expect(signalListeners.size).toBe(0)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("maps a signaled React Router process to a signal outcome", async () => {
    const outcome = await runCli(["build"], {
      async runReactRouter() {
        await new Promise<void>((resolve) => {
          setImmediate(resolve)
        })
        return { code: null, signal: "SIGINT" }
      },
    })

    expect(outcome).toStrictEqual({ type: "signal", signal: "SIGINT" })
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

function parseCapturedProcess(source: string): { cwd: string; args: string[] } {
  const value: unknown = JSON.parse(source)
  if (
    typeof value !== "object" ||
    value === null ||
    !("cwd" in value) ||
    typeof value.cwd !== "string" ||
    !("args" in value) ||
    !Array.isArray(value.args) ||
    !value.args.every((argument) => typeof argument === "string")
  ) {
    throw new Error("The process fixture wrote an invalid capture")
  }

  return { cwd: value.cwd, args: value.args }
}
