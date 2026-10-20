import { describe, expect, it } from "vitest"

import type { SidebarItem } from "../config/types"

import { findCurrentSidebarItem, getPrevNextLinks, sidebarPathsMatch } from "./sidebar-utils"

const sidebar: SidebarItem[] = [
  {
    text: "Rust",
    items: [
      { text: "Start", link: "/rust/getting-started/" },
      { text: "Configuration", link: "/rust/configuration" },
      { text: "Pipelines", link: "/rust/pipelines/" },
    ],
  },
]

describe("documentation route matching", () => {
  it.each(["/rust/configuration", "/rust/configuration/"])(
    "keeps navigation available at %s",
    (path) => {
      expect(findCurrentSidebarItem(sidebar, path)?.text).toBe("Configuration")
      expect(getPrevNextLinks(sidebar, path)).toStrictEqual({
        prev: { text: "Start", link: "/rust/getting-started/" },
        next: { text: "Pipelines", link: "/rust/pipelines/" },
      })
    }
  )

  it("matches slash-terminated entries without matching sibling route prefixes", () => {
    expect(findCurrentSidebarItem(sidebar, "/rust/getting-started")?.text).toBe("Start")
    expect(sidebarPathsMatch("/guide/file", "/guide/files/")).toBe(false)
    expect(getPrevNextLinks(sidebar, "/rust/missing/")).toStrictEqual({})
  })

  it("keeps the root route distinct from an absent link", () => {
    expect(sidebarPathsMatch("/", "/")).toBe(true)
    expect(sidebarPathsMatch(undefined, "/")).toBe(false)
    expect(sidebarPathsMatch("", "/")).toBe(false)
  })
})
