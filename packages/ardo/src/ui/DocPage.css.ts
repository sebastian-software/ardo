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
  gridTemplateColumns: `minmax(0, 72rem) ${vars.layout.tocWidth}`,
  justifyContent: "start",
  gap: "clamp(2rem, 4vw, 4rem)",
  maxWidth: "100rem",
  margin: "0 auto",
  paddingTop: vars.space["2xl"],
  "@media": {
    "(min-width: 1536px)": {
      gridTemplateColumns: `minmax(0, 78rem) ${vars.layout.tocWidth}`,
    },
    "(max-width: 1280px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      maxWidth: "min(100%, 72rem)",
      justifyContent: "center",
    },
    "(max-width: 1024px)": {
      paddingTop: vars.space.xl,
    },
  },
})

export const contentContainer = style({
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
})

export const contentHeader = style({
  marginBottom: vars.space.xl,
  paddingBottom: vars.space.sm,
})

export const contentTitle = style({
  fontSize: "clamp(2rem, 4vw, 3.15rem)",
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.08,
  letterSpacing: "-0.01em",
  marginBottom: vars.space.sm,
  overflowWrap: "break-word",
  textWrap: "balance",
})

export const contentDescription = style({
  fontSize: vars.fontSize.lg,
  color: vars.color.textLight,
  lineHeight: 1.65,
  maxWidth: vars.layout.contentMaxWidth,
  overflowWrap: "break-word",
  textWrap: "pretty",
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
  padding: `${vars.space.xs} 0 ${vars.space.lg}`,
  overflowY: "auto",
  // No background, border, radius or shadow — the right column is a column,
  // not a card. Matches the rail-less pattern of Mintlify, Vercel, React,
  // Tailwind, VitePress, Stripe, Linear.
  "@media": {
    "(max-width: 1280px)": {
      display: "none",
    },
  },
})

export const pageRailSection = style({
  padding: `${vars.space.md} 0`,
  selectors: {
    "&:first-child": {
      paddingTop: 0,
    },
    "&:not(:last-child)": {
      borderBottom: `1px solid ${vars.color.borderLight}`,
    },
  },
})

export const pageRailTitle = style({
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: vars.color.textLighter,
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
      color: vars.color.accent,
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
