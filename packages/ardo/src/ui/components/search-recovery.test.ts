import { afterEach, describe, expect, it, vi } from "vitest"

import { consumeSearchRecoveryQuery, getSearchRecoveryQuery, reloadSearch } from "./search-recovery"

afterEach(() => {
  vi.unstubAllGlobals()
})

function recoveryEnvironment() {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    },
  }
  const location = { href: "https://docs.example/guide/#setup", reload: vi.fn() }
  vi.stubGlobal("sessionStorage", storage)
  vi.stubGlobal("location", location)
  return { storage, location }
}

describe("search reload recovery", () => {
  it("preserves the query for one reload and consumes it once", () => {
    const { location } = recoveryEnvironment()
    reloadSearch("markdown")

    expect(location.reload).toHaveBeenCalledOnce()
    expect(getSearchRecoveryQuery()).toBe("markdown")
    expect(consumeSearchRecoveryQuery()).toBe("markdown")
    expect(getSearchRecoveryQuery()).toBeUndefined()
  })

  it("does not restore a query on another URL", () => {
    const { location } = recoveryEnvironment()
    reloadSearch("markdown")
    location.href = "https://docs.example/api/"

    expect(consumeSearchRecoveryQuery()).toBeUndefined()
    location.href = "https://docs.example/guide/#setup"
    expect(getSearchRecoveryQuery()).toBeUndefined()
  })

  it("still reloads when session storage is denied", () => {
    const { storage, location } = recoveryEnvironment()
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("Storage denied")
    })

    reloadSearch("markdown")

    expect(location.reload).toHaveBeenCalledOnce()
    expect(getSearchRecoveryQuery()).toBeUndefined()
  })
})
