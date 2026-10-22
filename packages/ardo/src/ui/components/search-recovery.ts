const STORAGE_KEY = "ardo-search-recovery"

/** Read a one-use query only on the page that requested the reload. */
export function getSearchRecoveryQuery(): string | undefined {
  try {
    const recovery: unknown = JSON.parse(globalThis.sessionStorage.getItem(STORAGE_KEY) ?? "null")
    if (
      recovery != null &&
      typeof recovery === "object" &&
      "url" in recovery &&
      recovery.url === globalThis.location.href &&
      "query" in recovery &&
      typeof recovery.query === "string"
    )
      return recovery.query
  } catch {
    // Storage may be unavailable or contain an old value.
  }
  return undefined
}

export function consumeSearchRecoveryQuery(): string | undefined {
  const query = getSearchRecoveryQuery()
  try {
    globalThis.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Search still works when session storage is denied.
  }
  return query
}

/** A new document clears the browser's cached failed dynamic imports. */
export function reloadSearch(query: string): void {
  try {
    globalThis.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        url: globalThis.location.href,
        query,
      })
    )
  } catch {
    // Reload remains available even if the query cannot be preserved.
  }
  globalThis.location.reload()
}
