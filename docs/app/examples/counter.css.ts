import { style } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

export const counter = style({
  padding: `${vars.space.sm} ${vars.space.lg}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  background: vars.color.bgSoft,
  color: vars.color.text,
  font: "inherit",
  cursor: "pointer",
  ":hover": { borderColor: vars.color.brand },
  ":focus-visible": { outline: `2px solid ${vars.color.brand}`, outlineOffset: "3px" },
})
