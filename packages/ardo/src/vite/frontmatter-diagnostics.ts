import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

export type BuildDiagnosticContext = {
  error: (message: string) => never
  warn: (message: string) => void
}

export function reportFrontmatterDiagnostics(
  context: BuildDiagnosticContext,
  manifest: RouteManifestEntry[],
  config: ResolvedConfig
) {
  const policy = config.validation?.frontmatter
  const diagnosticsByLevel = collectDiagnosticsByLevel(manifest, policy)
  reportDiagnostics(context, {
    diagnosticsByLevel,
    level: "warn",
    title: "[ardo] Frontmatter diagnostics",
  })
  reportDiagnostics(context, {
    diagnosticsByLevel,
    level: "error",
    title: "[ardo] Invalid frontmatter",
  })
}

function collectDiagnosticsByLevel(
  manifest: RouteManifestEntry[],
  policy: NonNullable<ResolvedConfig["validation"]>["frontmatter"]
): Map<"error" | "warn", string[]> {
  const diagnosticsByLevel = new Map<"error" | "warn", string[]>()

  for (const entry of manifest) {
    for (const diagnostic of entry.frontmatterDiagnostics ?? []) {
      const level = resolveDiagnosticLevel(diagnostic.kind, policy)
      if (level === "ignore") continue

      const messages = diagnosticsByLevel.get(level) ?? []
      messages.push(`${entry.filePath}: ${diagnostic.message}`)
      diagnosticsByLevel.set(level, messages)
    }
  }

  return diagnosticsByLevel
}

function resolveDiagnosticLevel(
  kind: "invalid" | "unknown",
  policy: NonNullable<ResolvedConfig["validation"]>["frontmatter"]
) {
  return kind === "unknown" ? (policy?.unknown ?? "ignore") : (policy?.invalid ?? "warn")
}

function reportDiagnostics(
  context: BuildDiagnosticContext,
  input: {
    diagnosticsByLevel: Map<"error" | "warn", string[]>
    level: "error" | "warn"
    title: string
  }
) {
  const messages = input.diagnosticsByLevel.get(input.level)
  if (messages == null || messages.length === 0) return

  const message = `${input.title}:\n${messages.join("\n")}`
  if (input.level === "error") {
    context.error(message)
  } else {
    context.warn(message)
  }
}
