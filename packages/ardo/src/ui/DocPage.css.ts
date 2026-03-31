import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

/**
 * 3-column layout: Sidebar (fixed) | Content (fluid) | TOC (fixed)
 *
 * Sidebar and TOC are position:fixed and stay visible while scrolling.
 * Content sits between them using left/right margins to reserve their space.
 */
export const docPage = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minWidth: 0,
})

export const contentContainer = style({
  flex: 1,
  minWidth: 0,
  maxWidth: "none",
  padding: `0 ${vars.space.content}`,
  "@media": {
    "(min-width: 1281px)": {
      marginRight: vars.layout.tocWidth,
    },
  },
})

export const contentHeader = style({
  marginBottom: vars.space.section,
  paddingBottom: vars.space.content,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const contentTitle = style({
  fontSize: `clamp(${vars.fontSize["3xl"]}, 5vw, 2.625rem)`,
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: "-0.03em",
  marginBottom: "0.75rem",
})

export const contentDescription = style({
  fontSize: `clamp(${vars.fontSize.base}, 2vw, ${vars.fontSize.lg})`,
  color: vars.color.textLight,
  lineHeight: 1.65,
  maxWidth: "60ch",
})

export const contentBody = style({
  lineHeight: 1.8,
})
