import { spawn, type SpawnOptions } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

import { prepareProjectConfig } from "./project-config"

export type ReactRouterCommand = "build" | "dev"

export type ChildExit = {
  code: null | number
  signal: NodeJS.Signals | null
}

type SignalTarget = {
  on: (signal: NodeJS.Signals, listener: () => void) => unknown
  off: (signal: NodeJS.Signals, listener: () => void) => unknown
}

export type ProjectConfigPreparer = (
  root: string,
  explicitVitePath?: string
) => Promise<string> | string

type RunReactRouterOptions = {
  cwd: string
  /** Extra environment variables for the React Router process. */
  env?: Record<string, string>
  binPath?: string
  signalTarget?: SignalTarget
  prepareProjectConfig?: ProjectConfigPreparer
}

const require = createRequire(import.meta.url)
const forwardedSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"]

export function resolveReactRouterBin(): string {
  let packageJsonPath: string

  try {
    packageJsonPath = require.resolve("@react-router/dev/package.json")
  } catch (error) {
    throw new Error(
      "Ardo's dev and build commands require the @react-router/dev package. Install Ardo with its declared dependencies.",
      { cause: error }
    )
  }

  const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  const bin = getReactRouterBin(packageJson)

  if (bin == null) {
    throw new Error(
      `The installed @react-router/dev package does not declare its react-router bin: ${packageJsonPath}`
    )
  }

  return path.resolve(path.dirname(packageJsonPath), bin)
}

export async function runReactRouterCommand(
  command: ReactRouterCommand,
  args: readonly string[],
  options: RunReactRouterOptions
): Promise<ChildExit> {
  const binPath = options.binPath ?? resolveReactRouterBin()
  const signalTarget = options.signalTarget ?? process
  const forwardedArgs = hasHelpOrVersion(args)
    ? [...args]
    : await withArdoProjectConfig(args, options)
  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    stdio: "inherit",
    ...(options.env == null ? {} : { env: { ...process.env, ...options.env } }),
  }

  return new Promise<ChildExit>((resolve, reject) => {
    const child = spawn(process.execPath, [binPath, command, ...forwardedArgs], spawnOptions)
    const signalHandlers = new Map<NodeJS.Signals, () => void>()

    const removeSignalHandlers = () => {
      for (const [signal, handler] of signalHandlers) signalTarget.off(signal, handler)
      signalHandlers.clear()
    }

    for (const signal of forwardedSignals) {
      const handler = () => {
        child.kill(signal)
      }
      signalHandlers.set(signal, handler)
      signalTarget.on(signal, handler)
    }

    child.once("error", (error) => {
      removeSignalHandlers()
      reject(error)
    })

    child.once("exit", (code, signal) => {
      removeSignalHandlers()
      resolve({ code, signal })
    })
  })
}

async function withArdoProjectConfig(
  args: readonly string[],
  options: RunReactRouterOptions
): Promise<string[]> {
  const parsed = parseReactRouterArguments(args)
  const root = path.resolve(options.cwd, parsed.root ?? ".")
  const explicitVitePath = parsed.config == null ? undefined : path.resolve(root, parsed.config)
  const configPath = await (options.prepareProjectConfig ?? prepareProjectConfig)(
    root,
    explicitVitePath
  )

  const forwarded = [...parsed.forwardedArgs]
  const rootArgumentIndex = findFirstPositionalArgumentIndex(forwarded)
  if (rootArgumentIndex === undefined) {
    const rootInsertionIndex = forwarded.indexOf("--")
    forwarded.splice(rootInsertionIndex === -1 ? 0 : rootInsertionIndex, 0, root)
  } else {
    forwarded[rootArgumentIndex] = root
  }
  const endOfOptions = forwarded.indexOf("--")
  const insertionIndex = endOfOptions === -1 ? forwarded.length : endOfOptions
  forwarded.splice(insertionIndex, 0, "--config", configPath)
  return forwarded
}

function findFirstPositionalArgumentIndex(args: readonly string[]): number | undefined {
  const parsed = parseArgs({
    args: [...args],
    options: getReactRouterParseOptions(args),
    allowPositionals: true,
    strict: true,
    tokens: true,
  })
  return parsed.tokens.find((token) => token.kind === "positional")?.index
}

type ParsedReactRouterArguments = {
  root?: string
  config?: string
  forwardedArgs: string[]
}

function parseReactRouterArguments(args: readonly string[]): ParsedReactRouterArguments {
  const normalizedArgs = normalizeShortConfigEquals(args)
  const parsed = parseArgs({
    args: normalizedArgs,
    options: getReactRouterParseOptions(args),
    allowPositionals: true,
    strict: true,
  })
  const configValue = parsed.values.config
  if (configValue === "") throw new Error("--config requires a config file path.")

  return {
    root: parsed.positionals[0],
    config: typeof configValue === "string" ? configValue : undefined,
    forwardedArgs: removeConfigArguments(args),
  }
}

function getReactRouterParseOptions(args: readonly string[]) {
  return {
    assetsInlineLimit: { type: "string" },
    clearScreen: { type: "boolean" },
    config: { type: "string", short: "c" },
    cors: { type: "boolean" },
    emptyOutDir: { type: "boolean" },
    force: { type: "boolean" },
    help: { type: "boolean", short: "h" },
    host: { type: isBooleanFlag(args, "--host") ? "boolean" : "string" },
    json: { type: "boolean" },
    logLevel: { type: "string", short: "l" },
    minify: { type: "string" },
    mode: { type: "string", short: "m" },
    "no-typescript": { type: "boolean" },
    open: { type: isBooleanFlag(args, "--open") ? "boolean" : "string" },
    port: { type: "string", short: "p" },
    profile: { type: "boolean" },
    sourcemapClient: {
      type: isBooleanFlag(args, "--sourcemapClient") ? "boolean" : "string",
    },
    sourcemapServer: {
      type: isBooleanFlag(args, "--sourcemapServer") ? "boolean" : "string",
    },
    strictPort: { type: "boolean" },
    token: { type: "string" },
    typescript: { type: "boolean" },
    version: { type: "boolean", short: "v" },
    watch: { type: "boolean" },
  } as const
}

function isBooleanFlag(args: readonly string[], name: string): boolean {
  const nextArgument = args[args.indexOf(name) + 1]
  return !nextArgument || nextArgument.startsWith("-")
}

function normalizeShortConfigEquals(args: readonly string[]): string[] {
  const normalized: string[] = []
  let afterEndOfOptions = false
  for (const argument of args) {
    if (argument === "--") afterEndOfOptions = true
    normalized.push(
      !afterEndOfOptions && argument.startsWith("-c=") ? `--config=${argument.slice(3)}` : argument
    )
  }
  return normalized
}

function removeConfigArguments(args: readonly string[]): string[] {
  const forwarded: string[] = []
  let afterEndOfOptions = false
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === "--") afterEndOfOptions = true
    if (afterEndOfOptions) {
      forwarded.push(argument)
    } else if (argument === "--config" || argument === "-c") {
      index += 1
    } else if (argument.startsWith("--config=") || argument.startsWith("-c=")) {
      continue
    } else if (argument.startsWith("-c") && argument.length > 2) {
      continue
    } else {
      forwarded.push(argument)
    }
  }
  return forwarded
}

function hasHelpOrVersion(args: readonly string[]): boolean {
  const controlOptions = new Set(["--help", "-h", "--version", "-v"])
  const endOfOptions = args.indexOf("--")
  const optionArgs = endOfOptions === -1 ? args : args.slice(0, endOfOptions)
  return optionArgs.some((argument) => controlOptions.has(argument))
}

export function resolveArdoVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url))
  const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  if (!isRecord(packageJson)) return "unknown"
  return typeof packageJson.version === "string" ? packageJson.version : "unknown"
}

function getReactRouterBin(packageJson: unknown): string | undefined {
  if (!isRecord(packageJson)) return undefined
  const bin = packageJson.bin
  if (typeof bin === "string") return bin
  if (isRecord(bin) && typeof bin["react-router"] === "string") {
    return bin["react-router"]
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
