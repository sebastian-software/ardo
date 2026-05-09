import { globalStyle, style } from "@vanilla-extract/css"

import * as layoutStyles from "./Layout.css"
import { vars } from "./theme/contract.css"

export const footer = style({
  width: "100%",
  padding: `${vars.space["2xl"]} ${vars.space.xl}`,
  textAlign: "left",
  background: `color-mix(in oklch, ${vars.color.brand} 6%, ${vars.color.bgMute})`,
  margin: `${vars.space["2xl"]} 0 0`,
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
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: `${vars.space.xs} ${vars.space["2xl"]}`,
  width: "100%",
  maxWidth: "80rem",
  margin: "0 auto",
  "@media": {
    "(max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: vars.space.xs,
    },
  },
})

export const footerPrimary = style({
  display: "flex",
  alignItems: "center",
  gap: 0,
  flexWrap: "wrap",
  fontSize: vars.fontSize.sm,
  color: vars.color.textLight,
  marginBottom: 0,
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
  gridColumn: "1",
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const footerCopyright = style({
  gridColumn: "1",
  fontSize: vars.fontSize.sm,
  color: vars.color.textLighter,
})

export const footerBuildTime = style({
  gridColumn: "2",
  gridRow: "1 / span 3",
  justifySelf: "end",
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
  marginTop: "2px",
  textAlign: "right",
  "@media": {
    "(max-width: 768px)": {
      gridColumn: "1",
      gridRow: "auto",
      justifySelf: "start",
      textAlign: "left",
    },
  },
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
  padding: vars.space.lg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  textDecoration: "none",
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
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
