import { describe, expect, it } from "vitest"

import { isPathInsideDirectory, resolveRoutesDir, stripTrailingExtension } from "./path-utils"

describe("path-utils", () => {
  it("resolves relative routes directories against the Vite root", () => {
    expect(resolveRoutesDir("/site", "./src/routes")).toBe("/site/src/routes")
  })

  it("keeps sibling directories from matching a routes directory prefix", () => {
    expect(isPathInsideDirectory("/site/app/routes/guide/index.mdx", "/site/app/routes")).toBe(true)
    expect(isPathInsideDirectory("/site/app/routes-old/guide/index.mdx", "/site/app/routes")).toBe(
      false
    )
  })

  it("only strips file extensions from the end of a path", () => {
    expect(stripTrailingExtension("v1.md/changelog.md", ".md")).toBe("v1.md/changelog")
  })
})
