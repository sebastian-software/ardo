import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

export const embed = style({
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  margin: `${vars.space.lg} 0`,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bgSoft,
  boxShadow: vars.color.shadowSm,
})

export const frame = style({
  position: "absolute",
  inset: 0,
  display: "block",
  width: "100%",
  height: "100%",
  border: 0,
})
