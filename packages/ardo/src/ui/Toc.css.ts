import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const toc = style({
  width: "100%",
})

export const compactToc = style({
  marginBottom: vars.space.xl,
  borderTop: `1px solid ${vars.color.borderLight}`,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  "@media": { "(min-width: 1281px)": { display: "none" } },
})

export const compactSummary = style({
  padding: `${vars.space.md} 0`,
  cursor: "pointer",
  color: vars.color.text,
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  selectors: {
    "&:focus-visible": { outline: `2px solid ${vars.color.accent}`, outlineOffset: 4 },
  },
})

export const compactNav = style({ paddingBottom: vars.space.md })

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
