import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

/**
 * 3-column layout: Sidebar (fixed) | Content (fluid) | TOC (fixed)
 */
export const docPage = style({
  display: "grid",
  flex: 1,
  minWidth: 0,
  width: "100%",
  gridTemplateColumns: `minmax(0, ${vars.layout.contentMaxWidth}) ${vars.layout.tocWidth}`,
  justifyContent: "center",
  gap: "clamp(3rem, 6vw, 6rem)",
  maxWidth: "88rem",
  margin: "0 auto",
  paddingTop: vars.space["2xl"],
  "@media": {
    "(max-width: 1280px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      maxWidth: vars.layout.contentMaxWidth,
    },
    "(max-width: 1024px)": {
      paddingTop: vars.space.xl,
    },
  },
})

export const contentContainer = style({
  minWidth: 0,
  width: "100%",
  maxWidth: vars.layout.contentMaxWidth,
})

export const contentHeader = style({
  marginBottom: vars.space.xl,
  paddingBottom: vars.space.lg,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const contentTitle = style({
  fontSize: "clamp(2rem, 4vw, 3.15rem)",
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: "-0.01em",
  marginBottom: vars.space.sm,
  overflowWrap: "break-word",
})

export const contentDescription = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textLight,
  lineHeight: 1.65,
  maxWidth: "62ch",
  overflowWrap: "break-word",
})

export const contentBody = style({
  lineHeight: vars.font.lineHeight,
  overflowWrap: "break-word",
})

export const pageRail = style({
  width: vars.layout.tocWidth,
  position: "sticky",
  top: vars.space.xl,
  alignSelf: "start",
  maxHeight: `calc(100vh - ${vars.layout.headerHeight} - ${vars.space["2xl"]})`,
  paddingTop: vars.space.sm,
  overflowY: "auto",
  "@media": {
    "(max-width: 1280px)": {
      display: "none",
    },
  },
})

export const pageRailSection = style({
  padding: `${vars.space.lg} 0`,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  selectors: {
    "&:first-child": {
      paddingTop: 0,
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
})

export const pageRailTitle = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: vars.color.textLight,
  marginBottom: vars.space.sm,
})

export const pageRailText = style({
  fontSize: vars.fontSize.sm,
  lineHeight: 1.5,
  color: vars.color.textLight,
})

export const pageRailLink = style({
  display: "inline-flex",
  alignItems: "center",
  color: vars.color.text,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  transition: `color ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.brand,
    },
  },
})

export const pageRailSelect = style({
  width: "100%",
  minHeight: "2.5rem",
  padding: `0 ${vars.space.sm}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  background: vars.color.bg,
  color: vars.color.text,
  font: "inherit",
  fontSize: vars.fontSize.sm,
})
