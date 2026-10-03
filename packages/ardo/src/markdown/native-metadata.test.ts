import { describe, expect, it } from "vitest"

import { parseNativeFrontmatter } from "./native-metadata"

describe("parseNativeFrontmatter", () => {
  it("rejects an empty top-level YAML field name", () => {
    expect(() => parseNativeFrontmatter(": invalid", "yaml")).toThrow(
      "YAML frontmatter field names must not be empty"
    )
  })

  it("keeps Ardo frontmatter YAML-only", () => {
    expect(() => parseNativeFrontmatter("title = 'Guide'", "toml")).toThrow(
      "toml frontmatter is not supported"
    )
    expect(() => parseNativeFrontmatter("", "toml")).toThrow("toml frontmatter is not supported")
  })
})
