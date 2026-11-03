import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"

import type { ResolvedConfig } from "../config/types"
import type { CliOutcome } from "./run"
import type { DiagnosticFinding, DiagnosticRuntime, ProjectSnapshot } from "./diagnostics"

import { resolveDiagnosticLevel } from "../vite/frontmatter-diagnostics"
import { ARDO_CONFIG_NAMES, findProjectConfig } from "./project-config"
import {
  createFinding,
  errorMessage,
  hasErrors,
  loadProjectSnapshot,
  readDiagnosticRequest,
  renderDiagnostics,
  toProjectPath,
  toSeverity,
} from "./diagnostics"

/**
 * `ardo check`: a build-free preflight. It validates the environment against Ardo's declared
 * engines, loads and validates the project config the way `ardo build` does, and runs the build's
 * frontmatter validation over every route page. Only error findings change the exit code.
 */
export async function runCheckCommand(
  args: readonly string[],
  runtime: DiagnosticRuntime
): Promise<CliOutcome> {
  const request = readDiagnosticRequest("check", args, runtime)
  if (request.kind === "exit") return { type: "exit", code: request.code }

  const findings = [
    ...environmentFindings(process.versions.node, readArdoNodeEngine()),
    ...(await projectFindings(request.parsed, runtime)),
  ]
  runtime.stdout.write(renderDiagnostics("check", findings, request.parsed.format))
  return { type: "exit", code: hasErrors(findings) ? 1 : 0 }
}

/** Findings from the project: its config, then its pages. A config that fails to load is one finding. */
async function projectFindings(
  parsed: { config?: string; root: string },
  runtime: DiagnosticRuntime
): Promise<DiagnosticFinding[]> {
  let snapshot: ProjectSnapshot
  try {
    snapshot = await loadProjectSnapshot({
      config: parsed.config,
      prepareProjectConfig: runtime.prepareProjectConfig,
      root: parsed.root,
      stderr: runtime.stderr,
    })
  } catch (error) {
    return [
      createFinding({
        file: await describeConfigFile(parsed.root),
        message: errorMessage(error),
        rule: "config",
        severity: "error",
      }),
    ]
  }
  return frontmatterFindings(snapshot)
}

/** Compare the running Node.js with `engines.node` in Ardo's package manifest. */
export function environmentFindings(
  nodeVersion: string,
  engineRange: string | undefined
): DiagnosticFinding[] {
  if (engineRange === undefined) return []
  const satisfied = satisfiesMinimumVersion(nodeVersion, engineRange)
  if (satisfied === undefined) {
    return [
      createFinding({
        file: ".",
        message: `Could not compare Node.js ${nodeVersion} with the engines.node range "${engineRange}". Only ">=" ranges are supported here.`,
        rule: "environment",
        severity: "warning",
      }),
    ]
  }
  if (satisfied) return []
  return [
    createFinding({
      file: ".",
      message: `Node.js ${nodeVersion} does not satisfy Ardo's engines.node "${engineRange}". Upgrade Node.js.`,
      rule: "environment",
      severity: "error",
    }),
  ]
}

/** `undefined` when the range is not a minimum-version (">=") range. */
export function satisfiesMinimumVersion(version: string, range: string): boolean | undefined {
  const minimum = /^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/u.exec(range.trim())
  if (minimum == null) return undefined
  const wanted = [minimum[1], minimum[2] ?? "0", minimum[3] ?? "0"].map(Number)
  const actual = version.replace(/^v/u, "").split(".").map(Number)
  for (const [index, required] of wanted.entries()) {
    const current = actual[index] ?? 0
    if (current !== required) return current > required
  }
  return true
}

/** The engines.node range declared by the installed Ardo package. */
function readArdoNodeEngine(): string | undefined {
  const packageJson: unknown = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  )
  if (typeof packageJson !== "object" || packageJson === null || !("engines" in packageJson)) {
    return undefined
  }
  const { engines } = packageJson
  if (typeof engines !== "object" || engines === null || !("node" in engines)) return undefined
  return typeof engines.node === "string" ? engines.node : undefined
}

/** The config file a config failure should name, relative to the project root. */
async function describeConfigFile(root: string): Promise<string> {
  const found = await findProjectConfig(root, ARDO_CONFIG_NAMES)
  return found === undefined ? "." : toProjectPath(root, found)
}

/**
 * Frontmatter diagnostics for every route page, using the build's manifest entries and its
 * severity policy. Pages whose frontmatter cannot be parsed become errors.
 */
async function frontmatterFindings(snapshot: ProjectSnapshot): Promise<DiagnosticFinding[]> {
  // Loaded lazily with the other build modules that the CLI does not need for every command.
  const { createManifestEntry, createRouteManifestOptions, listRouteFiles } =
    await import("../vite/route-manifest")
  const findings: DiagnosticFinding[] = []
  const options = createRouteManifestOptions(snapshot.resolvedConfig)
  for (const filePath of await listRouteFiles(snapshot.routesDir)) {
    const file = toProjectPath(snapshot.root, filePath)
    let entry
    try {
      entry = await createManifestEntry(filePath, snapshot.routesDir, options)
    } catch (error) {
      findings.push(
        createFinding({
          file,
          message: `Could not read page metadata: ${errorMessage(error)}`,
          rule: "page",
          severity: "error",
        })
      )
      continue
    }
    for (const diagnostic of entry?.frontmatterDiagnostics ?? []) {
      const severity = toSeverity(
        resolveDiagnosticLevel(diagnostic.kind, frontmatterPolicy(snapshot.resolvedConfig))
      )
      if (severity === undefined) continue
      findings.push(
        createFinding({
          file,
          line: await frontmatterFieldLine(filePath, diagnostic.field),
          message: diagnostic.message,
          rule: "frontmatter",
          severity,
        })
      )
    }
  }
  return findings
}

function frontmatterPolicy(config: ResolvedConfig) {
  return config.validation?.frontmatter
}

/** The line that declares a frontmatter field, or undefined when the field is not written there. */
async function frontmatterFieldLine(filePath: string, field: string): Promise<number | undefined> {
  const source = await readFile(filePath, "utf8")
  const lines = source.split(/\r?\n/u)
  if (lines[0]?.trimEnd() !== "---") return undefined
  const escaped = field.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`)
  const declaration = new RegExp(`^${escaped}\\s*:`, "u")
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trimEnd() === "---") break
    if (declaration.test(line)) return index + 1
  }
  return undefined
}
