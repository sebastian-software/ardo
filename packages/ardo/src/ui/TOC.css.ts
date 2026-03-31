import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const toc = style({
  position: "fixed",
  top: vars.layout.headerHeight,
  right: 0,
  width: vars.layout.tocWidth,
  height: `calc(100vh - ${vars.layout.headerHeight})`,
  padding: `${vars.space.xl} 1.25rem ${vars.space.xl} ${vars.space.lg}`,
  overflowY: "auto",
  borderLeft: `1px solid ${vars.color.borderLight}`,
  "@media": {
    "(max-width: 1280px)": {
      display: "none",
    },
  },
})

export const tocTitle = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: vars.color.textLight,
  marginBottom: "1.25rem",
})

export const tocList = style({
  listStyle: "none",
})

export const tocLink = style({
  display: "block",
  padding: `${vars.space.xs} 0 ${vars.space.xs} ${vars.space.md}`,
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
      borderLeftColor: vars.color.borderLight,
    },
    "&.active": {
      color: vars.color.brand,
      borderLeftColor: vars.color.brand,
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
