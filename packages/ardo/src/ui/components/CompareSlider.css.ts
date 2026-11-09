import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

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

// react-compare-slider styles its own parts inline; these classes only add Ardo's look.
export const stage = style({})

export const layer = style({})

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

export const handleRoot = style({})

// The library removes the handle's outline, so the button shows keyboard focus instead.
globalStyle(`${handleRoot}:focus-visible .__rcs-handle-button`, {
  outline: `2px solid ${vars.color.ring}`,
  outlineOffset: "3px",
})

/*
 * The handle's parts take inline styles only: the library sets `--rcs-handle-color` inline on the
 * handle, so a stylesheet rule cannot override it.
 */
export const handleStyle = {
  "--rcs-handle-color": vars.color.brand,
}

export const handleButtonStyle = {
  width: "2.75rem",
  height: "2.75rem",
  gap: "0.375rem",
  backgroundColor: vars.color.bg,
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  boxShadow: vars.color.shadowMd,
}

export const handleLinesStyle = {
  boxShadow: "none",
}
