import { globalStyle, style } from "@vanilla-extract/css"

import * as layoutStyles from "./Layout.css"
import { vars } from "./theme/contract.css"

export const footer = style({
  width: "100%",
  padding: `${vars.space["2xl"]} ${vars.space.xl}`,
  textAlign: "left",
  background: `color-mix(in oklch, ${vars.color.brand} 5%, ${vars.color.bgSoft})`,
  borderTop: `1px solid ${vars.color.border}`,
  margin: 0,
  "@media": {
    "(max-width: 768px)": {
      padding: `${vars.space.xl} ${vars.space.md}`,
    },
  },
})

globalStyle(`main > .${footer}`, {
  width: `calc(100% + (${vars.space.xl} * 2))`,
  marginRight: `calc(${vars.space.xl} * -1)`,
  marginBottom: `calc(${vars.space.xl} * -1)`,
  marginLeft: `calc(${vars.space.xl} * -1)`,
  "@media": {
    "(max-width: 1024px)": {
      width: `calc(100% + (${vars.space.md} * 2))`,
      marginRight: `calc(${vars.space.md} * -1)`,
      marginLeft: `calc(${vars.space.md} * -1)`,
    },
  },
})

globalStyle(`.${layoutStyles.home} .${layoutStyles.main} > .${footer}`, {
  width: "100%",
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
})

export const footerContainer = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  width: "100%",
  maxWidth: "64rem",
  margin: "0 auto",
})

export const footerPrimary = style({
  display: "flex",
  alignItems: "center",
  gap: 0,
  flexWrap: "wrap",
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  color: vars.color.text,
  margin: 0,
  paddingBottom: vars.space.md,
  marginBottom: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
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
  color: vars.color.accent,
  textDecoration: "none",
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const footerArdoLink = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.375rem",
  color: vars.color.brand,
  textDecoration: "none",
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const footerOwl = style({
  color: vars.color.brand,
  opacity: 0.85,
  transition: `transform ${vars.transition.base}, opacity ${vars.transition.fast}`,
  selectors: {
    [`${footerArdoLink}:hover &`]: {
      transform: "rotate(-8deg)",
      opacity: 1,
    },
  },
})

export const footerMessage = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.textLight,
})

export const footerCopyright = style({
  margin: 0,
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const footerBuildTime = style({
  margin: `${vars.space.sm} 0 0`,
  fontSize: vars.fontSize.xs,
  color: `color-mix(in oklch, ${vars.color.accent} 55%, ${vars.color.textLighter})`,
  fontFamily: vars.font.mono,
  letterSpacing: "0.02em",
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
  color: vars.color.accent,
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
  padding: vars.space.lg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  textDecoration: "none",
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.accent,
      background: vars.color.bgSoft,
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
