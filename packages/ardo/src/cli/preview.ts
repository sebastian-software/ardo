import { constants } from "node:fs"
import { access, stat } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"
import { type InlineConfig, preview, type PreviewServer, resolveConfig } from "vite"

import type { ProjectConfigPreparer } from "./vite-command"

import { prepareProjectConfig } from "./project-config"

export type PreviewArguments = {
  root?: string
  host?: boolean | string
  port?: number
  strictPort?: boolean
  open?: boolean | string
  config?: string
  mode?: string
  base?: string
  outDir?: string
}

type PreviewServerUi = Pick<PreviewServer, "bindCLIShortcuts" | "printUrls">
type StartPreviewServer = (config: InlineConfig) => PreviewServerUi | Promise<PreviewServerUi>
type StartPreviewOptions = {
  startServer?: StartPreviewServer
  prepareProjectConfig?: ProjectConfigPreparer
}

type ResolvedPreviewProject = {
  options: PreviewArguments
  root: string
  configFile: string
  mode: string
  resolvedConfig: Awaited<ReturnType<typeof resolveConfig>>
  clientBuildDirectory: string
}

export class CliUsageError extends Error {}

const previewParseOptions = {
  base: { type: "string" },
  config: { type: "string", short: "c" },
  host: { type: "string" },
  mode: { type: "string", short: "m" },
  open: { type: "string" },
  outDir: { type: "string" },
  port: { type: "string", short: "p" },
  strictPort: { type: "boolean" },
} as const

type PreviewParseConfig = {
  args?: readonly string[]
  allowPositionals: true
  strict: true
  options: typeof previewParseOptions
}

const previewHelp = `Usage: ardo preview [root] [options]

Options:
  --host [host]       Bind to a host (default: localhost)
  --port, -p <port>   Port to listen on (default: 4173)
  --strictPort        Exit if the selected port is already in use
  --open [path]       Open the preview in a browser
  --config, -c <file> Use a Vite config file
  --mode, -m <mode>   Set the Vite mode (default: production)
  --base <path>       Override the configured base path
  --outDir <dir>      Override the React Router client build directory
  --help, -h          Show this help
`

export function getPreviewHelp(): string {
  return previewHelp
}

export function parsePreviewArguments(args: readonly string[]): PreviewArguments {
  const normalizedArgs = normalizeOptionalArguments(args)

  let parsed: ReturnType<typeof parseArgs<PreviewParseConfig>>
  try {
    parsed = parseArgs<PreviewParseConfig>({
      args: normalizedArgs,
      allowPositionals: true,
      strict: true,
      options: previewParseOptions,
    })
  } catch (error) {
    throw new CliUsageError(error instanceof Error ? error.message : String(error), {
      cause: error,
    })
  }

  if (parsed.positionals.length > 1) {
    throw new CliUsageError(
      `Expected at most one project root, received: ${parsed.positionals.join(" ")}`
    )
  }

  const portValue = parsed.values.port
  let port: number | undefined
  if (portValue != null) {
    port = Number(portValue)
    if (!Number.isInteger(port) || port < 0 || port > 65_535) {
      throw new CliUsageError(`Invalid port: ${portValue}`)
    }
  }

  return {
    root: parsed.positionals[0],
    host: optionalStringOrBoolean(parsed.values.host),
    port,
    strictPort: parsed.values.strictPort,
    open: optionalStringOrBoolean(parsed.values.open),
    config: parsed.values.config,
    mode: parsed.values.mode,
    base: parsed.values.base,
    outDir: parsed.values.outDir,
  }
}

function normalizeOptionalArguments(args: readonly string[]): string[] {
  const normalized: string[] = []
  let afterEndOfOptions = false

  for (let index = 0; index < args.length; index += 1) {
    const normalizedArgument = normalizeOptionalArgument(args, index, afterEndOfOptions)
    normalized.push(normalizedArgument.value)
    afterEndOfOptions ||= normalizedArgument.endsOptions
    index += normalizedArgument.consumed
  }

  return normalized
}

type NormalizedArgument = { value: string; consumed: number; endsOptions: boolean }

function normalizeOptionalArgument(
  args: readonly string[],
  index: number,
  afterEndOfOptions: boolean
): NormalizedArgument {
  const argument = args[index] ?? ""
  if (argument === "--") return { value: argument, consumed: 0, endsOptions: true }
  if (afterEndOfOptions) return { value: argument, consumed: 0, endsOptions: false }
  if (argument.startsWith("-c=")) {
    return { value: `--config=${argument.slice(3)}`, consumed: 0, endsOptions: false }
  }
  if (argument === "--host" || argument === "--open") {
    return normalizeOptionalValueFlag(args, index, argument)
  }
  return { value: argument, consumed: 0, endsOptions: false }
}

function normalizeOptionalValueFlag(
  args: readonly string[],
  index: number,
  flag: string
): NormalizedArgument {
  const nextArgument = args.at(index + 1)
  if (nextArgument !== undefined && !nextArgument.startsWith("-")) {
    return { value: `${flag}=${nextArgument}`, consumed: 1, endsOptions: false }
  }
  return { value: `${flag}=true`, consumed: 0, endsOptions: false }
}

function optionalStringOrBoolean(value: string | undefined): boolean | string | undefined {
  if (value == null) return undefined
  return value === "true" ? true : value
}

export async function startPreview(
  args: readonly string[],
  cwd = process.cwd(),
  options: StartPreviewOptions = {}
): Promise<void> {
  const project = await resolvePreviewProject(
    args,
    cwd,
    options.prepareProjectConfig ?? prepareProjectConfig
  )
  await assertClientBuild(project.clientBuildDirectory)
  const server = await (options.startServer ?? preview)(createPreviewConfig(project))
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
}

async function resolvePreviewProject(
  args: readonly string[],
  cwd: string,
  prepareConfig: ProjectConfigPreparer
): Promise<ResolvedPreviewProject> {
  const options = parsePreviewArguments(args)
  const root = path.resolve(cwd, options.root ?? ".")
  const explicitVitePath = options.config == null ? undefined : path.resolve(root, options.config)
  const configFile = await prepareConfig(root, explicitVitePath)
  const mode = options.mode ?? "production"
  const configForResolution: InlineConfig = {
    root,
    configFile,
    mode,
    ...(options.base == null ? {} : { base: options.base }),
    ...(options.outDir == null ? {} : { build: { outDir: path.resolve(root, options.outDir) } }),
    preview: definedPreviewOptions(options),
  }
  const resolvedConfig = await resolveConfig(
    configForResolution,
    "serve",
    "production",
    "production",
    true
  )
  const clientBuildDirectory = path.resolve(
    resolvedConfig.root,
    options.outDir ?? resolvedConfig.environments.client.build.outDir
  )

  return { options, root, configFile, mode, resolvedConfig, clientBuildDirectory }
}

async function assertClientBuild(clientBuildDirectory: string): Promise<void> {
  try {
    const buildStat = await stat(clientBuildDirectory)
    if (!buildStat.isDirectory()) throw new Error("not a directory")
  } catch {
    throw new Error(
      `No React Router client build found at ${clientBuildDirectory}. Run "ardo build" before "ardo preview".`
    )
  }

  try {
    await access(path.join(clientBuildDirectory, "index.html"), constants.R_OK)
  } catch {
    throw new Error(
      `No index.html found in the React Router client build at ${clientBuildDirectory}. Enable prerendering or SPA mode before running "ardo preview".`
    )
  }
}

function createPreviewConfig({
  options,
  root,
  configFile,
  mode,
  resolvedConfig,
  clientBuildDirectory,
}: ResolvedPreviewProject): InlineConfig {
  return {
    root,
    configFile,
    mode,
    ...(options.base == null ? {} : { base: options.base }),
    build: { outDir: clientBuildDirectory },
    preview: {
      ...resolvedConfig.preview,
      host: options.host ?? resolvedConfig.preview.host,
      port: options.port ?? resolvedConfig.preview.port,
      strictPort: options.strictPort ?? resolvedConfig.preview.strictPort,
      open: options.open ?? resolvedConfig.preview.open,
    },
  }
}

function definedPreviewOptions(options: PreviewArguments): NonNullable<InlineConfig["preview"]> {
  return {
    ...(options.host == null ? {} : { host: options.host }),
    ...(options.port == null ? {} : { port: options.port }),
    ...(options.strictPort == null ? {} : { strictPort: options.strictPort }),
    ...(options.open == null ? {} : { open: options.open }),
  }
}
