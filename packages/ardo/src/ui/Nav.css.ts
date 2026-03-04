import { style } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const nav = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
})

export const navLink = style({
  position: "relative",
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: "2px",
      background: vars.color.brand,
      borderRadius: "1px",
      transition: `width ${vars.transition.base}`,
    },
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgSoft,
    },
    "&.active": {
      color: vars.color.brand,
    },
    "&.active::after": {
      width: "calc(100% - 28px)",
    },
  },
})

export const socialLink = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  color: vars.color.textLight,
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgSoft,
    },
  },
})
