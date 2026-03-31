import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

/**
 * 3-column layout: Sidebar (fixed) | Content (fluid) | TOC (fixed)
 */
export const docPage = style({
  display: "flex",
  flex: 1,
  minWidth: 0,
  gap: vars.space["3xl"],
  maxWidth: "80rem",
})

export const contentContainer = style({
  flex: 1,
  minWidth: 0,
  maxWidth: "none",
})

export const contentHeader = style({
  marginBottom: vars.space.lg,
  paddingBottom: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const contentTitle = style({
  fontSize: vars.fontSize["2xl"],
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.025em",
  marginBottom: vars.space.xs,
})

export const contentDescription = style({
  fontSize: vars.fontSize.base,
  color: vars.color.textLight,
  lineHeight: 1.6,
  maxWidth: "60ch",
})

export const contentBody = style({
  lineHeight: 1.6,
})
