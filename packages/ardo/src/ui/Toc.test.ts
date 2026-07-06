import { describe, expect, it } from "vitest"

import { getTocScrollBehavior } from "./Toc"

describe("getTocScrollBehavior", () => {
  it("honors reduced-motion preferences", () => {
    expect(getTocScrollBehavior(true)).toBe("auto")
    expect(getTocScrollBehavior(false)).toBe("smooth")
  })
})
