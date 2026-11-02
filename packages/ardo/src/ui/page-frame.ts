import type { StyleRule } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const frameMaxWidth = "var(--ardo-frame-max-width)"
export const pageFrameMaxWidth = `calc(${vars.layout.pageMaxWidth} + 2 * ${vars.space.lg})`

/** Keep standalone components responsive, and adapt framed layouts to their own width. */
export function frameResponsive(
  rules: NonNullable<StyleRule["@media"]>
): Pick<StyleRule, "@media" | "@container"> {
  return {
    "@media": rules,
    "@container": Object.fromEntries(
      Object.entries(rules).map(([query, rule]) => [`ardo-page-frame ${query}`, rule])
    ),
  }
}
