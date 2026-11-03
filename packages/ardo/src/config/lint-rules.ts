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
