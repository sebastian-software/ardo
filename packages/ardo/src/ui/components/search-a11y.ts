export type SearchKeyboardAction =
  | { index: number; type: "select-index" }
  | { path: string; type: "navigate" }
  | { type: "close" }
  | { type: "none" }

export type SearchKeyboardResult = {
  path: string
}

export function getSearchOptionId(listboxId: string, resultId: string, index: number) {
  return `${listboxId}-option-${toDomIdSegment(resultId)}-${index}`
}

export function getActiveSearchOptionId({
  getOptionId,
  isOpen,
  results,
  selectedIndex,
}: {
  getOptionId: (resultId: string, index: number) => string
  isOpen: boolean
  results: Array<{ id: string }>
  selectedIndex: number
}): string | undefined {
  if (!isOpen || results.length === 0) {
    return
  }

  const selectedResult = getResultAtIndex(results, selectedIndex)
  if (selectedResult == null) {
    return
  }

  return getOptionId(selectedResult.id, selectedIndex)
}

export function getSearchKeyboardAction({
  key,
  results,
  selectedIndex,
}: {
  key: string
  results: SearchKeyboardResult[]
  selectedIndex: number
}): SearchKeyboardAction {
  switch (key) {
    case "ArrowDown":
      return results.length > 0
        ? { type: "select-index", index: Math.min(selectedIndex + 1, results.length - 1) }
        : { type: "none" }
    case "ArrowUp":
      return results.length > 0
        ? { type: "select-index", index: Math.max(selectedIndex - 1, 0) }
        : { type: "none" }
    case "Enter": {
      const selectedResult = getResultAtIndex(results, selectedIndex)
      return selectedResult == null
        ? { type: "none" }
        : { type: "navigate", path: selectedResult.path }
    }
    case "Escape":
      return { type: "close" }
    default:
      return { type: "none" }
  }
}

function toDomIdSegment(value: string) {
  return Array.from(value, (char) => char.charCodeAt(0).toString(36)).join("-")
}

function getResultAtIndex<T>(results: T[], selectedIndex: number) {
  if (selectedIndex < 0 || selectedIndex >= results.length) {
    return
  }

  return results[selectedIndex]
}

/**
 * True while an input method composes text, when Enter confirms a candidate instead of a result.
 * keyCode 229 covers Safari, which ends composition before the Enter keydown.
 */
export function isComposingKeyEvent(event: Pick<KeyboardEvent, "isComposing" | "keyCode">) {
  return event.isComposing || event.keyCode === 229
}

type ShortcutKeyEvent = Pick<KeyboardEvent, "altKey" | "ctrlKey" | "key" | "metaKey">

/** True for the global search shortcut: ⌘K on macOS, Ctrl+K elsewhere. */
export function isSearchShortcut(event: ShortcutKeyEvent): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k"
}

/** Shortcut modifier label rendered on the server, before the platform is known. */
export const SERVER_SEARCH_SHORTCUT_MODIFIER = "⌘"

/** Modifier label for the shortcut hint. Defaults to ⌘ when no platform is known (SSR). */
export function getSearchShortcutModifier(
  platform = typeof navigator === "undefined" ? undefined : navigator.platform
): string {
  if (platform == null) return SERVER_SEARCH_SHORTCUT_MODIFIER
  return /Mac|iPhone|iPad|iPod/.test(platform) ? "⌘" : "Ctrl"
}
