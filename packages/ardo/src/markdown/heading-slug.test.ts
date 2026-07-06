import { describe, expect, it } from "vitest"

import { createHeadingSlugger, slugifyHeadingText } from "./heading-slug"

describe("slugifyHeadingText", () => {
  it("preserves unicode letters and strips markdown punctuation", () => {
    expect(slugifyHeadingText("Über `uns` & Einführung")).toBe("über-uns-einführung")
  })

  it("normalizes whitespace and trims dashes", () => {
    expect(slugifyHeadingText("  Hello   world!  ")).toBe("hello-world")
  })
})

describe("createHeadingSlugger", () => {
  it("deduplicates repeated heading ids", () => {
    const slugger = createHeadingSlugger()

    expect(slugger.slug("Example")).toBe("example")
    expect(slugger.slug("Example")).toBe("example-1")
    expect(slugger.slug("Example")).toBe("example-2")
  })

  it("uses deterministic fallback ids for empty headings", () => {
    const slugger = createHeadingSlugger()

    expect(slugger.slug("!!!")).toBe("heading-0")
    expect(slugger.slug("???")).toBe("heading-1")
  })
})
