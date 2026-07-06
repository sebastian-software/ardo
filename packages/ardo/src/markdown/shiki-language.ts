import { type BundledLanguage, bundledLanguages, type Highlighter } from "shiki"

const warnedHighlightFailures = new Set<string>()

export async function resolveHighlightLanguage(params: {
  highlighter: Highlighter
  language: string
  sourcePath?: string
}): Promise<string> {
  const normalizedLanguage = normalizeLanguage(params.language)
  if (isPlainTextLanguage(normalizedLanguage)) {
    return "text"
  }

  if (params.highlighter.getLoadedLanguages().includes(normalizedLanguage)) {
    return normalizedLanguage
  }

  if (!isBundledLanguage(normalizedLanguage)) {
    warnHighlightFailure({
      key: `missing:${normalizedLanguage}`,
      language: normalizedLanguage,
      message: "language is not bundled with Shiki",
      sourcePath: params.sourcePath,
    })
    return "text"
  }

  try {
    await params.highlighter.loadLanguage(normalizedLanguage)
    return normalizedLanguage
  } catch (error) {
    warnHighlightFailure({
      error,
      key: `load:${normalizedLanguage}`,
      language: normalizedLanguage,
      message: "language could not be loaded",
      sourcePath: params.sourcePath,
    })
    return "text"
  }
}

export function warnHighlightFailure(params: {
  error?: unknown
  key: string
  language: string
  message: string
  sourcePath?: string
}): void {
  const key = `${params.key}:${params.sourcePath ?? ""}`
  if (warnedHighlightFailures.has(key)) {
    return
  }

  warnedHighlightFailures.add(key)
  const location = params.sourcePath == null ? "" : ` in ${params.sourcePath}`
  const detail = params.error == null ? "" : `: ${formatErrorMessage(params.error)}`
  console.warn(
    `[ardo] Could not highlight code block language "${params.language}"${location}: ${params.message}${detail}`
  )
}

function normalizeLanguage(language: string): string {
  const normalizedLanguage = language.trim().toLowerCase()
  return normalizedLanguage === "" ? "text" : normalizedLanguage
}

function isPlainTextLanguage(language: string): boolean {
  return ["plain", "plaintext", "text", "txt"].includes(language)
}

function isBundledLanguage(language: string): language is BundledLanguage {
  return Object.hasOwn(bundledLanguages, language)
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
