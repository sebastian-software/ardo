import { access, readFile } from "node:fs/promises"
import path from "node:path"

import type { CliOutcome } from "./run"
import type { DiagnosticFinding, DiagnosticRuntime, ProjectSnapshot } from "./diagnostics"

import { lintPage } from "../lint/page-lint"
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

/** Files Ardo writes into the routes directory. Their pages are generated, so lint skips them. */
const generatedMarkers = [".ardo-generated", ".ardo-publication"] as const

/**
 * `ardo lint`: opt-in authoring rules for the Markdown and MDX pages in the routes directory.
 * Findings are warnings unless `validation.lint` raises a rule. Only errors change the exit code.
 */
export async function runLintCommand(
  args: readonly string[],
  runtime: DiagnosticRuntime
): Promise<CliOutcome> {
  const request = readDiagnosticRequest("lint", args, runtime)
  if (request.kind === "exit") return { type: "exit", code: request.code }

  let snapshot: ProjectSnapshot
  try {
    snapshot = await loadProjectSnapshot({
      config: request.parsed.config,
      prepareProjectConfig: runtime.prepareProjectConfig,
      root: request.parsed.root,
      stderr: runtime.stderr,
    })
  } catch (error) {
    // Without a loaded project there is no routes directory or severity policy to lint against.
    runtime.stderr.write(`Ardo lint failed: ${errorMessage(error)}\n`)
    return { type: "exit", code: 1 }
  }

  const findings = await lintFindings(snapshot)
  runtime.stdout.write(renderDiagnostics("lint", findings, request.parsed.format))
  return { type: "exit", code: hasErrors(findings) ? 1 : 0 }
}

async function lintFindings(snapshot: ProjectSnapshot): Promise<DiagnosticFinding[]> {
  // Loaded lazily with the other build modules that the CLI does not need for every command.
  const { listRouteFiles } = await import("../vite/route-manifest")
  const severities = snapshot.resolvedConfig.validation?.lint ?? {}
  const findings: DiagnosticFinding[] = []

  for (const filePath of await listRouteFiles(snapshot.routesDir)) {
    if (!/\.mdx?$/u.test(filePath)) continue
    if (await isGeneratedPage(filePath, snapshot.routesDir)) continue

    const file = toProjectPath(snapshot.root, filePath)
    const source = await readFile(filePath, "utf8")
    for (const finding of lintPage(source)) {
      const severity = toSeverity(severities[finding.rule] ?? "warn")
      if (severity === undefined) continue
      findings.push(
        createFinding({
          column: finding.column,
          file,
          line: finding.line,
          message: finding.message,
          rule: finding.rule,
          severity,
        })
      )
    }
  }
  return findings
}

/** A page is generated when it or one of its parent directories inside the routes directory has a marker. */
async function isGeneratedPage(filePath: string, routesDir: string): Promise<boolean> {
  const root = path.resolve(routesDir)
  let directory = path.dirname(path.resolve(filePath))
  for (;;) {
    for (const marker of generatedMarkers) {
      if (await exists(path.join(directory, marker))) return true
    }
    if (directory === root) return false
    const parent = path.dirname(directory)
    if (parent === directory) return false
    directory = parent
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
