import { realpathSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { CliUsageError, getPreviewHelp, startPreview } from "./preview"
import { prepareProjectConfig } from "./project-config"
import { canNotifyUpdates, createCliServices, trackingNotice, type CliServices } from "./services"
import {
  type ProjectConfigPreparer,
  resolveArdoVersion,
  runViteCommand,
  ViteUsageError,
} from "./vite-command"

export type CliOutcome = { type: "exit"; code: number } | { type: "signal"; signal: NodeJS.Signals }

type RunCliOptions = {
  cwd?: string
  stdout?: Pick<NodeJS.WriteStream, "write">
  stderr?: Pick<NodeJS.WriteStream, "write"> & { isTTY?: boolean }
  runVite?: typeof runViteCommand
  startPreview?: (args: readonly string[], cwd: string) => Promise<unknown>
  prepareProjectConfig?: ProjectConfigPreparer
  services?: CliServices
}

type CliRuntime = {
  cwd: string
  stdout: Pick<NodeJS.WriteStream, "write">
  stderr: Pick<NodeJS.WriteStream, "write"> & { isTTY?: boolean }
  runVite: typeof runViteCommand
  startPreview: (args: readonly string[], cwd: string) => Promise<unknown>
  prepareProjectConfig: ProjectConfigPreparer
  services?: CliServices
}

type CliCommand = "build" | "dev" | "preview"

const help = `Usage: ardo <command> [root] [options]

Commands:
  dev       Start the development server
  build     Build the site into static HTML
  preview   Preview the built site
  telemetry Manage optional CLI usage reporting
  update-check Check for a newer stable Ardo release

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
    runVite: options.runVite ?? runViteCommand,
    startPreview:
      options.startPreview ??
      (async (previewArgs, cwd) =>
        startPreview(previewArgs, cwd, {
          prepareProjectConfig: projectConfigPreparer,
        })),
    prepareProjectConfig: projectConfigPreparer,
    services: options.services,
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

  if (command === "telemetry") return runTelemetryCommand(commandArgs, runtime)
  if (command === "update-check") return runUpdateCommand(commandArgs, runtime)

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
  try {
    if (!args.includes("--help") && !args.includes("-h")) {
      await prepareCliServices(command, args, runtime).catch(() => null)
    }
    if (command === "preview") return await runPreviewCommand(args, runtime)
    const result = await runtime.runVite(command, args, {
      cwd: runtime.cwd,
      prepareProjectConfig: runtime.prepareProjectConfig,
    })
    return { type: "exit", code: result.code }
  } catch (error) {
    runtime.stderr.write(`Ardo ${command} failed: ${errorMessage(error)}\n`)
    return { type: "exit", code: error instanceof ViteUsageError ? 2 : 1 }
  }
}

async function prepareCliServices(
  command: CliCommand,
  args: readonly string[],
  runtime: CliRuntime
): Promise<void> {
  try {
    await runtime.services?.recordInvocation(command)
    if (canNotifyUpdates(args, runtime.stderr.isTTY)) {
      const result = await runtime.services?.checkForUpdates()
      if (result?.ok && result.value) {
        runtime.stderr.write(
          `\nArdo ${result.value.latestVersion} is available.\n${result.value.releaseUrl}\nUpdate the ardo dependency with your package manager.\n`
        )
      }
    }
  } finally {
    // Finish the SDK work before entering a long-lived dev/preview server.
    await runtime.services?.complete()
  }
}

const telemetryHelp = `Usage: ardo telemetry <status|preview|enable|disable|delete>

${trackingNotice}

  status        Show consent and effective collection restrictions as JSON
  preview       Show unsent payloads without reporting credentials as JSON
  enable --yes  Explicitly consent to the reporting described above
  disable       Withdraw consent and discard unsent usage
  delete        Disable reporting and queue deletion of previously sent data

Offline mode (ARDO_OFFLINE=1) prevents delivery, including deletion.
CI reporting is disabled. Settings apply to the current local/CI profile.
`

const telemetryActions = {
  status: (services: CliServices) => services.status(),
  preview: (services: CliServices) => services.preview(),
  enable: (services: CliServices) => services.enableReporting({ consent: "informed" }),
  disable: (services: CliServices) => services.withdrawReporting(),
  delete: (services: CliServices) => services.deleteReporting(),
}

async function runTelemetryCommand(
  args: readonly string[],
  runtime: CliRuntime
): Promise<CliOutcome> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    runtime.stdout.write(telemetryHelp)
    return { type: "exit", code: 0 }
  }
  const [action, ...flags] = args
  if (
    !Object.hasOwn(telemetryActions, action ?? "") ||
    (action === "enable" ? flags.join() !== "--yes" : flags.length > 0)
  ) {
    runtime.stderr.write(telemetryHelp)
    return { type: "exit", code: 2 }
  }
  try {
    if (!runtime.services) throw new Error("CLI services are unavailable")
    if (action === "enable") runtime.stderr.write(`${trackingNotice}\n\n`)
    const status = await telemetryActions[action as keyof typeof telemetryActions](runtime.services)
    runtime.stdout.write(`${JSON.stringify(status, null, 2)}\n`)
    return { type: "exit", code: 0 }
  } catch (error) {
    runtime.stderr.write(`Ardo telemetry failed: ${errorMessage(error)}\n`)
    return { type: "exit", code: 1 }
  }
}

async function runUpdateCommand(args: readonly string[], runtime: CliRuntime): Promise<CliOutcome> {
  if (args[0] === "--help" || args[0] === "-h") {
    runtime.stdout.write(
      "Usage: ardo update-check\n\nChecks public release metadata without usage reporting.\nDisable checks with ARDO_UPDATE_CHECK=0; disable networking with ARDO_OFFLINE=1.\n"
    )
    return { type: "exit", code: 0 }
  }
  if (args.length > 0) {
    runtime.stderr.write("Usage: ardo update-check\n")
    return { type: "exit", code: 2 }
  }
  try {
    const release = await runtime.services?.checkForUpdates()
    if (!release?.ok) throw new Error("Update check unavailable")
    runtime.stdout.write(`${JSON.stringify(release.value ?? null, null, 2)}\n`)
    return { type: "exit", code: 0 }
  } catch {
    runtime.stderr.write("Ardo update information is temporarily unavailable.\n")
    return { type: "exit", code: 1 }
  } finally {
    await runtime.services?.complete()
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
  void runCli(args, { services: createCliServices({ version: resolveArdoVersion() }) })
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
