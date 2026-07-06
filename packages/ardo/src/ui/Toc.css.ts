import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const toc = style({
  width: "100%",
})

export const tocTitle = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textLighter,
  marginBottom: vars.space.sm,
})

export const tocList = style({
  margin: 0,
  padding: 0,
  listStyle: "none",
})

export const tocLink = style({
  display: "block",
  padding: `${vars.space.xs} 0 ${vars.space.xs} ${vars.space.sm}`,
  color: vars.color.textLighter,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  lineHeight: 1.5,
  fontWeight: 400,
  borderLeft: "2px solid transparent",
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      borderLeftColor: vars.color.border,
    },
    "&.active": {
      color: vars.color.accent,
      borderLeftColor: vars.color.accent,
      fontWeight: 500,
    },
  },
})

export const tocLink3 = style({
  paddingLeft: "1.75rem",
})

export const tocLink4 = style({
  paddingLeft: "2.5rem",
})
