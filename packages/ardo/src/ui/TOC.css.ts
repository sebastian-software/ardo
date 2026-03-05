import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const toc = style({
  position: "fixed",
  top: vars.layout.headerHeight,
  right: 0,
  width: vars.layout.tocWidth,
  height: `calc(100vh - ${vars.layout.headerHeight})`,
  padding: "24px 20px",
  overflowY: "auto",
  "@media": {
    "(max-width: 1280px)": {
      display: "none",
    },
  },
})

export const tocTitle = style({
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textLighter,
  marginBottom: "16px",
})

export const tocList = style({
  listStyle: "none",
})

export const tocLink = style({
  display: "block",
  padding: "5px 0",
  paddingLeft: "14px",
  color: vars.color.textLighter,
  textDecoration: "none",
  fontSize: "13px",
  borderLeft: "2px solid transparent",
  marginLeft: "-14px",
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      borderLeftColor: vars.color.border,
    },
    "&.active": {
      color: vars.color.brand,
      borderLeftColor: vars.color.brand,
    },
  },
})

export const tocLink3 = style({
  paddingLeft: "26px",
})

export const tocLink4 = style({
  paddingLeft: "38px",
})
