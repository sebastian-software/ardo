import { describe, expect, it, vi } from "vitest"

import type { PageFrontmatter } from "../config/types"

import { sortByReadingOrder } from "./reading-order"

function page(routePath: string, frontmatter: PageFrontmatter = {}, sourceLocaleId?: string) {
  return {
    metadata: { publicPath: routePath, routePath, sourcePath: `${routePath}.md`, ...frontmatter },
    routePath,
    sourceLocaleId,
  }
}

const paths = (entries: ReturnType<typeof sortByReadingOrder>) =>
  entries.map(({ entry, localeId, section }) =>
    [localeId, section, entry.routePath].filter(Boolean).join(" ")
  )

describe("sortByReadingOrder", () => {
  it("puts the home page and top-level pages first, then sections in tab order", () => {
    const entries = [
      page("/reference/cli"),
      page("/api-reference/types/config"),
      page("/changelog"),
      page("/guide/install"),
      page("/"),
      page("/about"),
    ]
    expect(paths(sortByReadingOrder(entries))).toStrictEqual([
      "/",
      "/about",
      "/changelog",
      "guide /guide/install",
      "reference /reference/cli",
      "api-reference /api-reference/types/config",
    ])
  })

  it("lets sidebar.sectionOrder move a section ahead of the catalog", () => {
    const entries = [page("/guide/install"), page("/api-reference/types/config")]
    expect(
      paths(sortByReadingOrder(entries, { sectionOrder: ["api-reference"] })).map(
        (line) => line.split(" ")[0]
      )
    ).toStrictEqual(["api-reference", "guide"])
  })

  it("orders a folder's own page first, then children by order and title", () => {
    const entries = [
      page("/guide/zebra"),
      page("/guide/releases/v5", { title: "Upgrade to v5" }),
      page("/guide/releases", { order: 20 }),
      page("/guide/releases/v6", { order: 1 }),
      page("/guide/alpha"),
      page("/guide/start", { order: 2 }),
      page("/guide", { title: "Guide" }),
    ]
    expect(sortByReadingOrder(entries).map(({ entry }) => entry.routePath)).toStrictEqual([
      "/guide",
      "/guide/start",
      "/guide/releases",
      "/guide/releases/v6",
      "/guide/releases/v5",
      "/guide/alpha",
      "/guide/zebra",
    ])
  })

  it("keeps the configured locale order", () => {
    const entries = [page("/guide/a", {}, "de"), page("/guide/a", {}, "en")]
    expect(paths(sortByReadingOrder(entries, { localeIds: ["en", "de"] }))).toStrictEqual([
      "en guide /guide/a",
      "de guide /guide/a",
    ])
  })

  it("orders titles with a fixed locale, independent of the build machine", () => {
    const compare = vi.spyOn(String.prototype, "localeCompare")
    sortByReadingOrder([page("/guide/zeta"), page("/guide/Äther"), page("/guide/alpha")])
    expect(compare).toHaveBeenCalled()
    for (const call of compare.mock.calls) expect(call[1]).toBe("en")
    compare.mockRestore()
  })
})
