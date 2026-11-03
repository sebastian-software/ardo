/** Opt-in authoring rules that `ardo lint` reports. They never run during `ardo build`. */
export const lintRuleIds = [
  "missing-description",
  "multiple-h1",
  "heading-skip",
  "code-language",
  "shell-prompt",
] as const

export type LintRuleId = (typeof lintRuleIds)[number]

export function isLintRuleId(value: unknown): value is LintRuleId {
  return typeof value === "string" && (lintRuleIds as readonly string[]).includes(value)
}

/**
 * Normalize the page-level `lint` frontmatter value. Undefined means the value has another shape,
 * which frontmatter validation reports.
 */
export function normalizeLintFrontmatter(
  value: unknown
): { lint: boolean | { disable?: LintRuleId[] } } | undefined {
  if (typeof value === "boolean") return { lint: value }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  if (Object.keys(value).some((key) => key !== "disable")) return undefined
  if (!("disable" in value) || value.disable === undefined) return { lint: {} }
  if (!Array.isArray(value.disable) || !value.disable.every(isLintRuleId)) return undefined
  return { lint: { disable: value.disable } }
}
