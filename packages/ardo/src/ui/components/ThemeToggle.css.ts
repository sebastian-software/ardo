import { style } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const themeToggle = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: vars.color.textLight,
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
      color: vars.color.text,
    },
  },
})
