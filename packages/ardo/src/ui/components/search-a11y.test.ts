import { describe, expect, it } from "vitest"

import { getActiveSearchOptionId, getSearchKeyboardAction, getSearchOptionId } from "./search-a11y"

describe("search accessibility helpers", () => {
  const results = [{ path: "/intro" }, { path: "/api" }, { path: "/config" }]

  it("moves the active option with arrow keys and clamps to available results", () => {
    expect(getSearchKeyboardAction({ key: "ArrowDown", results, selectedIndex: 0 })).toStrictEqual({
      type: "select-index",
      index: 1,
    })
    expect(getSearchKeyboardAction({ key: "ArrowDown", results, selectedIndex: 2 })).toStrictEqual({
      type: "select-index",
      index: 2,
    })
    expect(getSearchKeyboardAction({ key: "ArrowUp", results, selectedIndex: 2 })).toStrictEqual({
      type: "select-index",
      index: 1,
    })
    expect(getSearchKeyboardAction({ key: "ArrowUp", results, selectedIndex: 0 })).toStrictEqual({
      type: "select-index",
      index: 0,
    })
  })

  it("maps Enter, Escape, and unrelated keys to explicit actions", () => {
    expect(getSearchKeyboardAction({ key: "Enter", results, selectedIndex: 1 })).toStrictEqual({
      type: "navigate",
      path: "/api",
    })
    expect(getSearchKeyboardAction({ key: "Enter", results: [], selectedIndex: 0 })).toStrictEqual({
      type: "none",
    })
    expect(getSearchKeyboardAction({ key: "Escape", results, selectedIndex: 1 })).toStrictEqual({
      type: "close",
    })
    expect(getSearchKeyboardAction({ key: "Tab", results, selectedIndex: 1 })).toStrictEqual({
      type: "none",
    })
  })

  it("builds stable option ids and exposes an active descendant only while open", () => {
    const optionId = getSearchOptionId("search-results", "guide/config", 1)
    expect(optionId).toBe("search-results-option-2v-39-2x-2s-2t-1b-2r-33-32-2u-2x-2v-1")

    expect(
      getActiveSearchOptionId({
        getOptionId: (id, index) => getSearchOptionId("search-results", id, index),
        isOpen: true,
        results: [{ id: "intro" }, { id: "guide/config" }],
        selectedIndex: 1,
      })
    ).toBe(optionId)

    expect(
      getActiveSearchOptionId({
        getOptionId: (id, index) => getSearchOptionId("search-results", id, index),
        isOpen: false,
        results: [{ id: "intro" }],
        selectedIndex: 0,
      })
    ).toBeUndefined()
  })
})
