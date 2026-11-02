import { createVar, style } from "@vanilla-extract/css"

import { frameResponsive } from "./page-frame"
import { vars } from "./theme/contract.css"

const gutter = createVar()

export const container = style({
  vars: { [gutter]: vars.space.lg },
  width: "100%",
  maxWidth: `calc(${vars.layout.pageMaxWidth} + 2 * ${gutter})`,
  marginInline: "auto",
  paddingInline: gutter,
  selectors: {
    '&[data-width="reading"]': {
      maxWidth: `calc(${vars.layout.contentMaxWidth} + 2 * ${gutter})`,
    },
  },
  ...frameResponsive({
    "(max-width: 768px)": { vars: { [gutter]: vars.space.md } },
  }),
})
