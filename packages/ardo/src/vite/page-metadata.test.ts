import { describe, expect, it } from "vitest"

import { validatePageFrontmatter } from "./page-metadata"

describe("validatePageFrontmatter", () => {
  it("normalizes the documented page metadata contract", () => {
    const result = validatePageFrontmatter({
      description: "A page",
      features: [{ details: "Useful", title: "Feature" }],
      hero: { actions: [{ link: "/guide", text: "Read the guide", theme: "brand" }] },
      next: { link: "/next", text: "Next" },
      order: 2,
      outline: [2, 4],
      redirectFrom: ["/old-guide"],
      sidebar: "leaf",
      title: "Guide",
      twitterCard: "summary_large_image",
    })

    expect(result.diagnostics).toStrictEqual([])
    expect(result.frontmatter).toStrictEqual({
      description: "A page",
      features: [{ details: "Useful", title: "Feature" }],
      hero: { actions: [{ link: "/guide", text: "Read the guide", theme: "brand" }] },
      next: { link: "/next", text: "Next" },
      order: 2,
      outline: [2, 4],
      redirectFrom: ["/old-guide"],
      sidebar: "leaf",
      title: "Guide",
      twitterCard: "summary_large_image",
    })
  })

  it("reports invalid and unknown values without emitting untyped metadata", () => {
    const result = validatePageFrontmatter({
      order: "first",
      redirectFrom: ["/old", 2],
      title: "Guide",
      titlle: "Typo",
    })

    expect(result.frontmatter).toStrictEqual({ redirectFrom: ["/old"], title: "Guide" })
    expect(result.diagnostics).toStrictEqual([
      {
        field: "order",
        kind: "invalid",
        message: 'Invalid value for frontmatter field "order".',
      },
      {
        field: "titlle",
        kind: "unknown",
        message: 'Unsupported frontmatter field "titlle".',
      },
    ])
  })

  it("normalizes a single redirect source to the redirect list contract", () => {
    expect(validatePageFrontmatter({ redirectFrom: "/old-guide" }).frontmatter).toStrictEqual({
      redirectFrom: ["/old-guide"],
    })
  })
})
