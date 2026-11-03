import path from "node:path"
import { format as formatMessage, parseArgs } from "node:util"
import { resolveConfig as resolveViteConfig } from "vite"

import type { DiagnosticLevel, ResolvedConfig } from "../config/types"
import type { ProjectConfigPreparer } from "./vite-command"

import { readArdoProjectState } from "../vite/project-state"
import { CliUsageError } from "./preview"
import { createProjectConfigLogger } from "./vite-command"

export type DiagnosticsCommand = "check" | "lint"
export type DiagnosticFormat = "json" | "text"
export type DiagnosticSeverity = "error" | "warning"

/** A problem that `ardo check` or `ardo lint` reports. `file` is relative to the project root. */
export type DiagnosticFinding = {
  column?: number
  file: string
  line?: number
  message: string
  rule: string
  severity: DiagnosticSeverity
}

export type DiagnosticRuntime = {
  cwd: string
  prepareProjectConfig: ProjectConfigPreparer
  stderr: Pick<NodeJS.WriteStream, "write">
  stdout: Pick<NodeJS.WriteStream, "write">
}

export type ParsedDiagnosticArguments = {
  config?: string
  format: DiagnosticFormat
  root: string
}

/** Either a request to run the command, or the exit code of an argument, help, or usage outcome. */
export type DiagnosticRequest =
  { kind: "exit"; code: number } | { kind: "run"; parsed: ParsedDiagnosticArguments }

export type ProjectSnapshot = {
  configFile: string
  resolvedConfig: ResolvedConfig
  root: string
  routesDir: string
}

const diagnosticOptions = {
  config: { type: "string", short: "c" },
  format: { type: "string" },
  help: { type: "boolean", short: "h" },
} as const

const diagnosticHelp: Record<DiagnosticsCommand, string> = {
  check: `Usage: ardo check [root] [options]

Checks the project without building it: the Node.js version against Ardo's engines,
the project config, and the frontmatter of every page. Exits 1 when any finding is an error.

Options:
  --format <text|json>  Output format (default: text)
  --config, -c <file>   Use a Vite config file
  --help, -h            Show this help
`,
  lint: `Usage: ardo lint [root] [options]

Reports opt-in authoring rules for Markdown and MDX pages in the routes directory:
missing-description, multiple-h1, heading-skip, code-language, shell-prompt.

Findings are warnings unless validation.lint raises a rule to "error". Only errors make the
command exit 1, and so does a project that cannot be loaded. A page can turn rules off with
frontmatter: lint: false, or lint: { disable: [...] }. Lint never affects ardo build.

Options:
  --format <text|json>  Output format (default: text)
  --config, -c <file>   Use a Vite config file
  --help, -h            Show this help
`,
}

export function getDiagnosticHelp(command: DiagnosticsCommand): string {
  return diagnosticHelp[command]
}

/**
 * Parse the arguments of `ardo check` or `ardo lint`. Help prints its text and usage errors
 * print a message, both on the right stream, and each returns the exit code to use.
 */
export function readDiagnosticRequest(
  command: DiagnosticsCommand,
  args: readonly string[],
  runtime: DiagnosticRuntime
): DiagnosticRequest {
  let parsed
  try {
    parsed = parseDiagnosticArguments(args, runtime.cwd)
  } catch (error) {
    if (!(error instanceof CliUsageError)) throw error
    runtime.stderr.write(`Ardo ${command} failed: ${error.message}\n`)
    return { kind: "exit", code: 2 }
  }
  if (parsed.help) {
    runtime.stdout.write(getDiagnosticHelp(command))
    return { kind: "exit", code: 0 }
  }
  return { kind: "run", parsed: parsed.arguments }
}

function parseDiagnosticArguments(
  args: readonly string[],
  cwd: string
): { arguments: ParsedDiagnosticArguments; help: boolean } {
  let parsed
  try {
    parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: diagnosticOptions,
    })
  } catch (error) {
    throw new CliUsageError(errorMessage(error), { cause: error })
  }
  if (parsed.positionals.length > 1) {
    throw new CliUsageError(
      `Expected at most one project root, received: ${parsed.positionals.join(" ")}`
    )
  }
  const format = parsed.values.format ?? "text"
  if (format !== "text" && format !== "json") {
    throw new CliUsageError(`Unsupported format "${format}". Use text or json.`)
  }
  return {
    arguments: {
      ...(parsed.values.config === undefined ? {} : { config: parsed.values.config }),
      format,
      root: path.resolve(cwd, parsed.positionals[0] ?? "."),
    },
    help: parsed.values.help === true,
  }
}

/**
 * Load the project the way `ardo build` does: the generated Vite config wrapper, then Vite's own
 * config resolution, which runs Ardo's config hooks. It stops before any bundle or page render.
 */
export async function loadProjectSnapshot(input: {
  config?: string
  prepareProjectConfig: ProjectConfigPreparer
  root: string
  stderr: Pick<NodeJS.WriteStream, "write">
}): Promise<ProjectSnapshot> {
  const explicitVitePath =
    input.config === undefined ? undefined : path.resolve(input.root, input.config)
  const configFile = await input.prepareProjectConfig(input.root, explicitVitePath)
  const resolved = await withLogsOnStderr(input.stderr, () =>
    resolveViteConfig(
      {
        configFile,
        customLogger: createProjectConfigLogger(configFile),
        root: input.root,
      },
      "build",
      "production",
      "production"
    )
  )
  const state = readArdoProjectState(resolved.plugins)
  if (state == null) {
    throw new Error("Ardo's Vite plugin did not resolve for this project.")
  }
  return {
    configFile,
    resolvedConfig: state.resolvedConfig,
    // Vite resolves the root through symlinks, and the routes directory follows that root.
    root: resolved.root,
    routesDir: state.routesDir,
  }
}

/**
 * Config hooks report progress with `console.log`. A diagnostics report owns stdout, so while the
 * project loads, that progress goes to stderr instead.
 */
async function withLogsOnStderr<T>(
  stderr: Pick<NodeJS.WriteStream, "write">,
  run: () => Promise<T>
): Promise<T> {
  const { info, log } = console
  const forward = (...args: unknown[]) => {
    stderr.write(`${formatMessage(...args)}\n`)
  }
  console.info = forward
  console.log = forward
  try {
    return await run()
  } finally {
    console.info = info
    console.log = log
  }
}

export function createFinding(input: {
  column?: number
  file: string
  line?: number
  message: string
  rule: string
  severity: DiagnosticSeverity
}): DiagnosticFinding {
  return {
    file: input.file,
    ...(input.line === undefined ? {} : { line: input.line }),
    ...(input.column === undefined ? {} : { column: input.column }),
    rule: input.rule,
    severity: input.severity,
    message: input.message,
  }
}

/** Map a configured level to a finding severity. `ignore` produces no finding. */
export function toSeverity(level: DiagnosticLevel): DiagnosticSeverity | undefined {
  if (level === "ignore") return undefined
  return level === "error" ? "error" : "warning"
}

export function toProjectPath(root: string, filePath: string): string {
  const relative = path.relative(root, filePath).split(path.sep).join("/")
  return relative === "" ? "." : relative
}

export function hasErrors(findings: readonly DiagnosticFinding[]): boolean {
  return findings.some((finding) => finding.severity === "error")
}

export function renderDiagnostics(
  command: DiagnosticsCommand,
  findings: readonly DiagnosticFinding[],
  format: DiagnosticFormat
): string {
  if (format === "json") return `${JSON.stringify(findings, null, 2)}\n`
  if (findings.length === 0) return `ardo ${command}: no problems found.\n`

  const lines = findings.map(
    (finding) =>
      `${formatLocation(finding)}  ${finding.severity}  ${finding.rule}  ${finding.message}`
  )
  const errors = findings.filter((finding) => finding.severity === "error").length
  const warnings = findings.length - errors
  lines.push("", `ardo ${command}: ${plural(errors, "error")}, ${plural(warnings, "warning")}.`)
  return `${lines.join("\n")}\n`
}

function formatLocation(finding: DiagnosticFinding): string {
  const line = finding.line === undefined ? "" : `:${finding.line}`
  const column = finding.column === undefined ? "" : `:${finding.column}`
  return `${finding.file}${line}${column}`
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
