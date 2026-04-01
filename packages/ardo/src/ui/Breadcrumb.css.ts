import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const breadcrumb = style({
  display: "none",
  alignItems: "center",
  gap: vars.space.sm,
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
  marginBottom: vars.space.md,
  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
    },
  },
})

export const breadcrumbSeparator = style({
  color: vars.color.textLighter,
})

export const breadcrumbCurrent = style({
  color: vars.color.text,
  fontWeight: 500,
})
