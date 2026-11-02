import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"
import { frameResponsive } from "./page-frame"

export const breadcrumb = style({
  display: "none",
  alignItems: "center",
  flexWrap: "wrap",
  minWidth: 0,
  overflowWrap: "anywhere",
  gap: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
  marginBottom: vars.space.md,
  ...frameResponsive({
    "(max-width: 1024px)": {
      display: "flex",
    },
  }),
})

export const breadcrumbSeparator = style({
  flexShrink: 0,
  display: "inline-flex",
  color: vars.color.textLighter,
  transform: "rotate(-90deg)",
})

export const breadcrumbCurrent = style({
  color: vars.color.text,
  fontWeight: 500,
})
