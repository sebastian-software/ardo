import { describe, expect, it } from "vitest"

import { validatePageFrontmatter } from "./page-metadata"

describe("validatePageFrontmatter banner", () => {
  it("accepts a string as plain banner text in the info variant", () => {
    const result = validatePageFrontmatter({ banner: "Version 7 is in beta." })

    expect(result.diagnostics).toStrictEqual([])
    expect(result.frontmatter).toStrictEqual({ banner: { content: "Version 7 is in beta." } })
  })

  it("normalizes an object and keeps only the documented keys", () => {
    const result = validatePageFrontmatter({
      banner: {
        content: "Maintenance tonight",
        dismissible: true,
        id: "maintenance",
        variant: "warning",
      },
    })

    expect(result.diagnostics).toStrictEqual([])
    expect(result.frontmatter).toStrictEqual({
      banner: {
        content: "Maintenance tonight",
        dismissible: true,
        id: "maintenance",
        variant: "warning",
      },
    })
  })

  it.each(["tip", "warning", "danger", "info", "note"])("accepts the %s variant", (variant) => {
    expect(
      validatePageFrontmatter({ banner: { content: "Notice", variant } }).diagnostics
    ).toStrictEqual([])
  })

  it.each([
    [
      "an empty string",
      "   ",
      'Invalid value for frontmatter field "banner": the banner text is empty.',
    ],
    [
      "a list",
      ["Notice"],
      'Invalid value for frontmatter field "banner": use a string or an object with a content key.',
    ],
    [
      "a number",
      3,
      'Invalid value for frontmatter field "banner": use a string or an object with a content key.',
    ],
    [
      "a missing content key",
      { variant: "tip" },
      'Invalid value for frontmatter field "banner": content must be a non-empty string.',
    ],
    [
      "an unknown variant",
      { content: "Notice", variant: "success" },
      'Invalid value for frontmatter field "banner": variant must be one of tip, warning, danger, info, or note.',
    ],
    [
      "a misspelled key",
      { content: "Notice", dismisable: true },
      'Invalid value for frontmatter field "banner": unsupported key "dismisable". Allowed keys are content, variant, id, and dismissible.',
    ],
    [
      "a non-boolean dismissible",
      { content: "Notice", dismissible: "yes" },
      'Invalid value for frontmatter field "banner": dismissible must be true or false.',
    ],
    [
      "an empty id",
      { content: "Notice", id: " " },
      'Invalid value for frontmatter field "banner": id must be a non-empty string.',
    ],
  ])("reports %s with a specific message", (_label, banner, message) => {
    const result = validatePageFrontmatter({ banner })

    expect(result.frontmatter).toStrictEqual({})
    expect(result.diagnostics).toStrictEqual([{ field: "banner", kind: "invalid", message }])
  })

  it("requires an id when the banner is dismissible", () => {
    const result = validatePageFrontmatter({ banner: { content: "Notice", dismissible: true } })

    expect(result.frontmatter).toStrictEqual({})
    expect(result.diagnostics).toStrictEqual([
      {
        field: "banner",
        kind: "invalid",
        message:
          'Invalid value for frontmatter field "banner": dismissible needs an id. The id keys the dismissal in localStorage, so use a stable value such as "release-7".',
      },
    ])
  })
})

describe("validatePageFrontmatter", () => {
  it("validates content width independently of shell width", () => {
    for (const contentWidth of ["reading", "page"] as const) {
      const result = validatePageFrontmatter({ contentWidth, fullWidth: false })
      expect(result.frontmatter).toStrictEqual({ contentWidth, fullWidth: false })
      expect(result.diagnostics).toStrictEqual([])
    }
    expect(validatePageFrontmatter({ contentWidth: "viewport" }).diagnostics).toContainEqual({
      field: "contentWidth",
      kind: "invalid",
      message: 'Invalid value for frontmatter field "contentWidth".',
    })
  })
  it("accepts boolean full-width exceptions and rejects other values", () => {
    expect(validatePageFrontmatter({ fullWidth: true }).frontmatter).toStrictEqual({
      fullWidth: true,
    })
    expect(validatePageFrontmatter({ fullWidth: false }).frontmatter).toStrictEqual({
      fullWidth: false,
    })
    expect(validatePageFrontmatter({ fullWidth: "true" }).diagnostics).toContainEqual({
      field: "fullWidth",
      kind: "invalid",
      message: 'Invalid value for frontmatter field "fullWidth".',
    })
  })
  it("normalizes the documented page metadata contract", () => {
    const result = validatePageFrontmatter({
      description: "A page",
      features: [{ details: "Useful", title: "Feature" }],
      hero: { actions: [{ link: "/guide", text: "Read the guide", theme: "brand" }] },
      layout: "bare",
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
      layout: "bare",
      next: { link: "/next", text: "Next" },
      order: 2,
      outline: [2, 4],
      redirectFrom: ["/old-guide"],
      sidebar: "leaf",
      title: "Guide",
      twitterCard: "summary_large_image",
    })
  })

  it("reports layouts that change nothing as invalid", () => {
    for (const layout of ["doc", "home", "page"]) {
      expect(validatePageFrontmatter({ layout }).diagnostics).toStrictEqual([
        {
          field: "layout",
          kind: "invalid",
          message: 'Invalid value for frontmatter field "layout".',
        },
      ])
    }
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
