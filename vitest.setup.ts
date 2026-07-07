if (typeof Element !== "undefined" && Element.prototype.scrollIntoView == null) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

// Node 24+ exposes global `localStorage`/`sessionStorage` that are `undefined`
// unless `--localstorage-file` is passed. Under Node 26 those globals are
// present and shadow jsdom's Web Storage, so DOM tests (and the components
// they render) see `localStorage === undefined` and throw. When running under
// jsdom, install a minimal in-memory Storage whenever the global is missing,
// so Web Storage works consistently across Node versions. jsdom's own Storage
// is left untouched when it is available.
function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

if (globalThis.window !== undefined) {
  const globals = globalThis as Record<string, unknown>
  for (const key of ["localStorage", "sessionStorage"]) {
    if (globals[key] == null) {
      Object.defineProperty(globalThis, key, {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      })
    }
  }
}
