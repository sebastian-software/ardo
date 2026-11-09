import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

/**
 * The divider's position, in percent of the stage width. The component sets it inline; it has a
 * stable name so a theme can read it too.
 */
export const positionProperty = "--ardo-compare-slider-position"
const position = `var(${positionProperty}, 50%)`

export const root = style({
  margin: `${vars.space.lg} 0`,
  padding: `${vars.space.smd} ${vars.space.md} ${vars.space.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg,
  boxShadow: vars.color.shadowSm,
})

export const tags = style({
  display: "flex",
  justifyContent: "space-between",
  gap: vars.space.md,
  marginBottom: vars.space.smd,
  paddingBottom: vars.space.sm,
  borderBottom: `1px solid ${vars.color.divider}`,
  color: vars.color.textLight,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  lineHeight: 1.4,
})

export const stage = style({
  position: "relative",
})

// Each layer is opaque, so the first hides the second left of the divider.
export const layer = style({
  background: vars.color.bg,
})

export const firstLayer = style({
  position: "absolute",
  inset: 0,
  clipPath: `inset(0 calc(100% - ${position}) 0 0)`,
})

// Both views must line up exactly, so media fill the width and lose the frame content images get.
globalStyle(
  `${layer} > img, ${layer} > svg, ${layer} > video, ${layer} > picture, ${layer} > picture > img`,
  {
    display: "block",
    width: "100%",
    height: "auto",
    margin: 0,
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
  }
)

export const divider = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: position,
  width: 0,
  marginLeft: "-1px",
  // A border, not a background, so the line stays visible in forced-colors mode.
  borderLeft: `2px solid ${vars.color.brand}`,
  pointerEvents: "none",
})

// The grip sits on the divider, centered, but no lower than near the top of a tall view.
globalStyle(`${divider}::after`, {
  content: "''",
  position: "absolute",
  top: "min(50%, 7.5rem)",
  left: "-1px",
  width: "28px",
  height: "28px",
  transform: "translate(-50%, -50%)",
  border: `2px solid ${vars.color.brand}`,
  borderRadius: vars.radius.full,
  background: vars.color.bg,
  boxShadow: vars.color.shadowMd,
})

// The native range input covers the stage, invisible, and does the work.
export const input = style({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  margin: 0,
  opacity: 0,
  cursor: "ew-resize",
  // A vertical swipe still scrolls the page on a touch screen.
  touchAction: "pan-y",
})

globalStyle(`${input}:focus-visible + ${divider}::after`, {
  outline: `2px solid ${vars.color.ring}`,
  outlineOffset: "3px",
})
