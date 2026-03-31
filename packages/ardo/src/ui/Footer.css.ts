import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const footer = style({
  maxWidth: "80rem",
  padding: `${vars.space["2xl"]} 0`,
  textAlign: "left",
  borderTop: `1px solid ${vars.color.border}`,
  marginTop: vars.space["2xl"],
})

export const footerContainer = style({})

export const footerPrimary = style({
  display: "flex",
  alignItems: "center",
  gap: 0,
  flexWrap: "wrap",
  fontSize: vars.fontSize.sm,
  color: vars.color.textLight,
  marginBottom: vars.space.xs,
})

export const footerSeparator = style({
  display: "inline-block",
  width: vars.space.xs,
  height: vars.space.xs,
  borderRadius: "50%",
  background: vars.color.textLighter,
  margin: `0 0.75rem`,
  verticalAlign: "middle",
})

export const footerLink = style({
  color: vars.color.brand,
  textDecoration: "none",
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const footerMessage = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const footerCopyright = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const footerBuildTime = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
  marginTop: vars.space.xs,
})

export const contentFooter = style({
  marginTop: vars.space["2xl"],
})

export const contentMeta = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: vars.space.lg,
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const editLink = style({
  color: vars.color.brand,
  textDecoration: "none",
  fontWeight: 500,
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const prevNext = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.md,
  maxWidth: "80rem",
})

const prevNextLinkBase = style({
  display: "flex",
  flexDirection: "column",
  padding: `1.25rem ${vars.space.lg}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  textDecoration: "none",
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
      background: vars.color.brandSubtle,
    },
  },
})

export const prevLink = style([prevNextLinkBase])

export const nextLink = style([prevNextLinkBase, { textAlign: "right" }])

export const prevNextLabel = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  color: vars.color.textLighter,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: vars.space.xs,
})

export const prevNextTitle = style({
  fontWeight: 600,
  color: vars.color.brand,
})
