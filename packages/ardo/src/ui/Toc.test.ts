import { describe, expect, it } from "vitest"

import { getTocScrollBehavior } from "./toc-navigation"

describe("getTocScrollBehavior", () => {
  it("honors reduced-motion preferences", () => {
    expect(getTocScrollBehavior(true)).toBe("auto")
    expect(getTocScrollBehavior(false)).toBe("smooth")
  })
})
