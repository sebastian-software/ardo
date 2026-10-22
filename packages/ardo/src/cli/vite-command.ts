import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { createBuilder, createServer, type InlineConfig, type LogLevel } from "vite"

import { prepareProjectConfig } from "./project-config"

export type ViteCommand = "build" | "dev"

export type ProjectConfigPreparer = (
  root: string,
  explicitVitePath?: string
) => Promise<string> | string

export type ViteCommandOptions = {
  cwd: string
  prepareProjectConfig?: ProjectConfigPreparer
}

/** Resolves when the command is done: after a build, or when the dev server closes. */
export type ViteCommandResult = { code: number }

export class ViteUsageError extends Error {}

type ParsedViteArguments = {
  root: string
  config?: string
  inline: InlineConfig
  help: boolean
}

const commonOptions = {
  clearScreen: { type: "boolean" },
  config: { type: "string", short: "c" },
  help: { type: "boolean", short: "h" },
  logLevel: { type: "string", short: "l" },
  mode: { type: "string", short: "m" },
} as const

const devOptions = {
  ...commonOptions,
  cors: { type: "boolean" },
  force: { type: "boolean" },
  host: { type: "string" },
  open: { type: "string" },
  port: { type: "string", short: "p" },
  strictPort: { type: "boolean" },
} as const

const buildOptions = {
  ...commonOptions,
  emptyOutDir: { type: "boolean" },
  minify: { type: "boolean" },
  sourcemap: { type: "boolean" },
} as const

const helpText: Record<ViteCommand, string> = {
  build: `Usage: ardo build [root] [options]

Builds the site into static HTML under <outDir>/client (default: build/client).

Options:
  --config, -c <file>   Use a Vite config file
  --mode, -m <mode>     Set the Vite mode (default: production)
  --logLevel, -l <lvl>  info | warn | error | silent
  --minify / --no-minify
  --emptyOutDir / --no-emptyOutDir
                       Clear or retain existing output files (default: clear)
  --sourcemap           Emit source maps for the client build
  --clearScreen         Clear the screen before logging
  --help, -h            Show this help
`,
  dev: `Usage: ardo dev [root] [options]

Starts the development server.

Options:
  --host [host]         Bind to a host (default: localhost)
  --port, -p <port>     Port to listen on (default: 5173)
  --strictPort          Exit if the selected port is already in use
  --open [path]         Open the site in a browser
  --force               Re-bundle dependencies
  --cors                Enable CORS
  --config, -c <file>   Use a Vite config file
  --mode, -m <mode>     Set the Vite mode (default: development)
  --logLevel, -l <lvl>  info | warn | error | silent
  --clearScreen         Clear the screen before logging
  --help, -h            Show this help
`,
}

export function getViteCommandHelp(command: ViteCommand): string {
  return helpText[command]
}

/** Run `ardo build` or `ardo dev` with Vite in this process. */
export async function runViteCommand(
  command: ViteCommand,
  args: readonly string[],
  options: ViteCommandOptions
): Promise<ViteCommandResult> {
  const parsed = parseViteArguments(command, args, options.cwd)
  if (parsed.help) {
    process.stdout.write(getViteCommandHelp(command))
    return { code: 0 }
  }
  const explicitVitePath =
    parsed.config == null ? undefined : path.resolve(parsed.root, parsed.config)
  const configFile = await (options.prepareProjectConfig ?? prepareProjectConfig)(
    parsed.root,
    explicitVitePath
  )
  const inline: InlineConfig = { ...parsed.inline, root: parsed.root, configFile }

  if (command === "build") {
    const builder = await createBuilder(inline)
    await builder.buildApp()
    return { code: 0 }
  }

  return startDevServer(inline)
}

/** Serve until the dev server closes, for example through its `q` shortcut. */
async function startDevServer(inline: InlineConfig): Promise<ViteCommandResult> {
  const server = await createServer(inline)
  await server.listen()
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
  return new Promise((resolve) => {
    server.httpServer?.once("close", () => {
      resolve({ code: 0 })
    })
  })
}

export function parseViteArguments(
  command: ViteCommand,
  args: readonly string[],
  cwd: string
): ParsedViteArguments {
  const normalized = normalizeOptionalValues(args, ["--host", "--open"])
  let parsed
  try {
    parsed = parseArgs({
      args: normalized,
      allowPositionals: true,
      allowNegative: true,
      strict: true,
      options: command === "dev" ? devOptions : buildOptions,
    })
  } catch (error) {
    throw new ViteUsageError(error instanceof Error ? error.message : String(error), {
      cause: error,
    })
  }
  if (parsed.positionals.length > 1) {
    throw new ViteUsageError(
      `Expected at most one project root, received: ${parsed.positionals.join(" ")}`
    )
  }
  const values = parsed.values as Record<string, boolean | string | undefined>
  const inline: InlineConfig = {
    ...defined("mode", stringValue(values.mode)),
    ...defined("clearScreen", booleanValue(values.clearScreen)),
    ...defined("logLevel", parseLogLevel(values.logLevel)),
  }
  if (command === "dev") {
    inline.server = {
      ...defined("host", optionalValue(values.host)),
      ...defined("port", parsePort(values.port)),
      ...defined("strictPort", booleanValue(values.strictPort)),
      ...defined("open", optionalValue(values.open)),
      ...defined("cors", booleanValue(values.cors)),
    }
    if (values.force === true) inline.optimizeDeps = { force: true }
  } else {
    inline.build = {
      ...defined("emptyOutDir", booleanValue(values.emptyOutDir)),
      ...defined("minify", booleanValue(values.minify)),
      ...defined("sourcemap", booleanValue(values.sourcemap)),
    }
  }
  return {
    root: path.resolve(cwd, parsed.positionals[0] ?? "."),
    config: stringValue(values.config),
    inline,
    help: values.help === true,
  }
}

export function resolveArdoVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url))
  const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  if (typeof packageJson !== "object" || packageJson === null || !("version" in packageJson)) {
    return "unknown"
  }
  return typeof packageJson.version === "string" ? packageJson.version : "unknown"
}

/** `--host` and `--open` take an optional value; a bare flag means `true`. */
function normalizeOptionalValues(args: readonly string[], names: string[]): string[] {
  const result: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] ?? ""
    const next = args[index + 1]
    if (names.includes(argument) && (next == null || next.startsWith("-"))) {
      result.push(`${argument}=true`)
    } else {
      result.push(argument)
    }
  }
  return result
}

function stringValue(value: boolean | string | undefined): string | undefined {
  return typeof value === "string" ? value : undefined
}

function booleanValue(value: boolean | string | undefined): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function optionalValue(value: boolean | string | undefined): boolean | string | undefined {
  if (value === "true") return true
  return value
}

function parsePort(value: boolean | string | undefined): number | undefined {
  if (typeof value !== "string") return undefined
  const port = Number(value)
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new ViteUsageError(`Invalid port: ${value}`)
  }
  return port
}

function parseLogLevel(value: boolean | string | undefined): LogLevel | undefined {
  if (value == null) return undefined
  if (value === "info" || value === "warn" || value === "error" || value === "silent") return value
  throw new ViteUsageError(`Invalid log level: ${String(value)}`)
}

function defined<TKey extends string, TValue>(
  key: TKey,
  value: TValue | undefined
): Partial<Record<TKey, TValue>> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, TValue>)
}
