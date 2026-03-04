import { style } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const copyText = style({})

export const copyButton = style({
  position: "absolute",
  top: "10px",
  right: "10px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  opacity: 0.6,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      opacity: 1,
      background: vars.color.bgSoft,
      borderColor: vars.color.brand,
      color: vars.color.brand,
    },
  },
})
