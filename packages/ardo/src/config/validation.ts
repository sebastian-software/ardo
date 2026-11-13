import type { ArdoConfig } from "./types"

import { isLintRuleId, lintRuleIds } from "./lint-rules"

export function validateChecksConfig(config: ArdoConfig, errors: string[]): void {
  validateLintConfig(config, errors)
  validateFrontmatterConfig(config, errors)
  validateLinkCheckConfig(config, errors)
}

function validateLintConfig(config: ArdoConfig, errors: string[]): void {
  const lint = config.validation?.lint
  if (lint == null) return

  for (const [rule, level] of Object.entries(lint)) {
    if (!isLintRuleId(rule)) {
      errors.push(
        `validation.lint has unknown rule "${rule}". Use one of: ${lintRuleIds.join(", ")}.`
      )
    } else if (level !== "error" && level !== "warn" && level !== "ignore") {
      errors.push(`validation.lint.${rule} must be "error", "warn", or "ignore".`)
    }
  }
}

function validateFrontmatterConfig(config: ArdoConfig, errors: string[]): void {
  const frontmatter = config.validation?.frontmatter
  if (frontmatter == null) return

  validateDiagnosticLevel("validation.frontmatter.invalid", frontmatter.invalid, errors)
  validateDiagnosticLevel("validation.frontmatter.unknown", frontmatter.unknown, errors)
}

function validateDiagnosticLevel(option: string, level: unknown, errors: string[]): void {
  if (level != null && level !== "error" && level !== "warn" && level !== "ignore") {
    errors.push(`${option} must be "error", "warn", or "ignore".`)
  }
}

function validateLinkCheckConfig(config: ArdoConfig, errors: string[]): void {
  const linkCheck = config.linkCheck
  if (linkCheck == null || typeof linkCheck !== "object") return

  if (linkCheck.enabled != null && typeof linkCheck.enabled !== "boolean") {
    errors.push("linkCheck.enabled must be a boolean.")
  }
  if (linkCheck.level != null && linkCheck.level !== "error" && linkCheck.level !== "warn") {
    errors.push('linkCheck.level must be "error" or "warn".')
  }
}
