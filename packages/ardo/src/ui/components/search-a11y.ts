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
