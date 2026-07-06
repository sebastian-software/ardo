type HighlightWarningInput = {
  error: unknown
  language: string
  sourcePath?: string
}

const warnedHighlightFailures = new Set<string>()

export function warnHighlightFailure(input: HighlightWarningInput): void {
  const source = input.sourcePath ?? "<unknown>"
  const warningKey = `${source}\0${input.language}`
  if (warnedHighlightFailures.has(warningKey)) {
    return
  }

  warnedHighlightFailures.add(warningKey)
  const sourceText = input.sourcePath == null ? "" : ` in ${input.sourcePath}`
  console.warn(
    `[ardo] Could not highlight ${JSON.stringify(input.language)} code${sourceText}: ${formatErrorMessage(input.error)}`
  )
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
