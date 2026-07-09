import { describe, expect, it } from "vitest"

import {
  ARDO_INTERNAL_LIFECYCLE_PHASES,
  getArdoInternalLifecyclePhase,
  runArdoLifecyclePhase,
} from "./lifecycle"

describe("internal lifecycle phases", () => {
  it("documents stable internal phase ids before exposing a public extension API", () => {
    expect(ARDO_INTERNAL_LIFECYCLE_PHASES.map((phase) => phase.id)).toStrictEqual([
      "config:resolve",
      "content-sources:materialize",
      "routes:generate",
      "metadata:scan",
      "sidebars:generate",
      "search:generate",
      "outputs:emit",
      "markdown:transform",
    ])
  })

  it("runs a named phase without exposing hook registration", async () => {
    await expect(runArdoLifecyclePhase("metadata:scan", () => "done")).resolves.toBe("done")
    expect(getArdoInternalLifecyclePhase("metadata:scan")).toMatchObject({
      futurePublicCandidate: true,
    })
  })
})
