import MiniSearch from "minisearch"
import { expect, it, vi } from "vitest"

import { loadSearchIndex } from "./search-index"

vi.mock("virtual:ardo/search-index", () => ({
  default: [{ id: "guide", title: "Guide", content: "Install Ardo", path: "/guide" }],
}))

it("retries failed search initialization and shares the successfully loaded index", async () => {
  const addAll = vi.spyOn(MiniSearch.prototype, "addAll")
  addAll.mockImplementationOnce(() => {
    throw new Error("Index unavailable")
  })

  await expect(loadSearchIndex()).rejects.toThrow("Index unavailable")
  const index = await loadSearchIndex()

  expect(index.search("install")[0]?.path).toBe("/guide")
  expect(await loadSearchIndex()).toBe(index)
  expect(addAll).toHaveBeenCalledTimes(2)
  addAll.mockRestore()
})
