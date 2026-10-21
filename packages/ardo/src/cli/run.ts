import { realpathSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { checkBuildOutput } from "./build-check"
import { CliUsageError, getPreviewHelp, startPreview } from "./preview"
import {
  type ChildExit,
  type ProjectConfigPreparer,
  resolveArdoVersion,
  runReactRouterCommand,
} from "./process"
import { ARDO_BUILD_INFO_ENV } from "../vite/build-info"
import { prepareProjectConfig } from "./project-config"

export type CliOutcome = { type: "exit"; code: number } | { type: "signal"; signal: NodeJS.Signals }

type RunCliOptions = {
  cwd?: string
  stdout?: Pick<NodeJS.WriteStream, "write">
  stderr?: Pick<NodeJS.WriteStream, "write">
  runReactRouter?: typeof runReactRouterCommand
  startPreview?: (args: readonly string[], cwd: string) => Promise<unknown>
  prepareProjectConfig?: ProjectConfigPreparer
}

type CliRuntime = {
  cwd: string
  stdout: Pick<NodeJS.WriteStream, "write">
  stderr: Pick<NodeJS.WriteStream, "write">
  runReactRouter: typeof runReactRouterCommand
  startPreview: (args: readonly string[], cwd: string) => Promise<unknown>
  prepareProjectConfig: ProjectConfigPreparer
}

type CliCommand = "build" | "dev" | "preview"

const help = `Usage: ardo <command> [root] [options]

Commands:
  dev       Start the React Router development server
  build     Build the React Router application
  preview   Preview a static React Router client build

Run "ardo <command> --help" for command options.
`

export async function runCli(
  args: readonly string[],
  options: RunCliOptions = {}
): Promise<CliOutcome> {
  const command = args[0] ?? ""
  const commandArgs = args.slice(1)
  const projectConfigPreparer = options.prepareProjectConfig ?? prepareProjectConfig
  const runtime: CliRuntime = {
    cwd: options.cwd ?? process.cwd(),
    stdout: options.stdout ?? process.stdout,
    stderr: options.stderr ?? process.stderr,
    runReactRouter: options.runReactRouter ?? runReactRouterCommand,
    startPreview:
      options.startPreview ??
      (async (previewArgs, cwd) =>
        startPreview(previewArgs, cwd, {
          prepareProjectConfig: projectConfigPreparer,
        })),
    prepareProjectConfig: projectConfigPreparer,
  }

  if (
    command === "" ||
    command === "--help" ||
    command === "-h" ||
    command === "--version" ||
    command === "-v"
  ) {
    return runGlobalCommand(command, runtime.stdout)
  }

  const commandHandlers = new Map<string, CliCommand>([
    ["dev", "dev"],
    ["build", "build"],
    ["preview", "preview"],
  ])
  const handler = commandHandlers.get(command)
  return handler == null
    ? runUnknownCommand(command, runtime.stderr)
    : runKnownCommand(handler, commandArgs, runtime)
}

async function runKnownCommand(
  command: CliCommand,
  args: readonly string[],
  runtime: CliRuntime
): Promise<CliOutcome> {
  if (command === "preview") return runPreviewCommand(args, runtime)
  if (command === "build") return runBuildCommand(args, runtime)

  try {
    return childExitOutcome(
      await runtime.runReactRouter(command, args, {
        cwd: runtime.cwd,
        prepareProjectConfig: runtime.prepareProjectConfig,
      })
    )
  } catch (error) {
    runtime.stderr.write(`Ardo ${command} failed: ${errorMessage(error)}\n`)
    return { type: "exit", code: 1 }
  }
}

async function runBuildCommand(args: readonly string[], runtime: CliRuntime): Promise<CliOutcome> {
  const report = await mkdtemp(path.join(tmpdir(), "ardo-build-"))
  const infoFile = path.join(report, "build-info.json")
  try {
    const outcome = childExitOutcome(
      await runtime.runReactRouter("build", args, {
        cwd: runtime.cwd,
        prepareProjectConfig: runtime.prepareProjectConfig,
        env: { [ARDO_BUILD_INFO_ENV]: infoFile },
      })
    )
    if (outcome.type !== "exit" || outcome.code !== 0) return outcome
    return checkBuildOutput(infoFile, runtime)
  } catch (error) {
    runtime.stderr.write(`Ardo build failed: ${errorMessage(error)}\n`)
    return { type: "exit", code: 1 }
  } finally {
    await rm(report, { recursive: true, force: true })
  }
}

async function runPreviewCommand(
  args: readonly string[],
  runtime: CliRuntime
): Promise<CliOutcome> {
  if (args.includes("--help") || args.includes("-h")) {
    runtime.stdout.write(getPreviewHelp())
    return { type: "exit", code: 0 }
  }

  try {
    await runtime.startPreview(args, runtime.cwd)
    return { type: "exit", code: 0 }
  } catch (error) {
    const code = error instanceof CliUsageError ? 2 : 1
    runtime.stderr.write(`Ardo preview failed: ${errorMessage(error)}\n`)
    return { type: "exit", code }
  }
}

function runGlobalCommand(command: string, stdout: Pick<NodeJS.WriteStream, "write">): CliOutcome {
  if (command === "--version" || command === "-v") {
    stdout.write(`${resolveArdoVersion()}\n`)
  } else {
    stdout.write(help)
  }
  return { type: "exit", code: 0 }
}

function runUnknownCommand(command: string, stderr: Pick<NodeJS.WriteStream, "write">): CliOutcome {
  stderr.write(`Unknown command "${command}".\n\n${help}`)
  return { type: "exit", code: 2 }
}

function childExitOutcome(result: ChildExit): CliOutcome {
  if (result.signal != null) return { type: "signal", signal: result.signal }
  return { type: "exit", code: result.code ?? 1 }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function isCliEntrypoint(moduleUrl: string, argvPath: string | undefined): boolean {
  if (argvPath == null) return false

  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(path.resolve(argvPath))
  } catch {
    return false
  }
}

export function runCliEntrypoint(args: readonly string[]): void {
  void runCli(args)
    .then((outcome) => {
      if (outcome.type === "signal") {
        process.kill(process.pid, outcome.signal)
      } else {
        process.exitCode = outcome.code
      }
    })
    .catch((error: unknown) => {
      process.stderr.write(`Ardo failed: ${errorMessage(error)}\n`)
      process.exitCode = 1
    })
}

export function isDirectCliInvocation(moduleUrl: string, argvPath = process.argv[1]): boolean {
  return isCliEntrypoint(moduleUrl, argvPath)
}
