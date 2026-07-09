import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

export const mermaid = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  margin: "24px 0",
  overflowX: "auto",
})

globalStyle(`${mermaid} svg`, {
  maxWidth: "100%",
  height: "auto",
})

export const source = style({
  width: "100%",
  margin: 0,
  padding: "16px 18px",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bgSoft,
  color: vars.color.textLight,
  fontSize: "13px",
  lineHeight: 1.6,
  overflowX: "auto",
})

export const error = style({
  width: "100%",
  margin: "0 0 8px",
  color: vars.color.danger,
  fontSize: "14px",
})
