import { style } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const navigation = style({ minWidth: 0 })
export const heading = style({
  color: vars.color.textLight,
  fontSize: vars.fontSize.xs,
  fontWeight: 600,
  margin: `0 ${vars.space.sm} ${vars.space.sm}`,
})
export const list = style({ listStyle: "none", padding: 0, margin: 0 })
export const link = style({
  display: "flex",
  alignItems: "center",
  minHeight: "2.75rem",
  padding: `${vars.space.sm} ${vars.space.sm}`,
  color: vars.color.text,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.5,
  textDecoration: "none",
  overflowWrap: "anywhere",
  selectors: {
    "&:hover": { background: vars.color.bgSoft },
    '&[aria-current="page"]': {
      color: vars.color.brand,
      background: vars.color.bgSoft,
      fontWeight: 600,
    },
    "&:focus-visible": { outline: `2px solid ${vars.color.accent}`, outlineOffset: "2px" },
  },
})
export const archive = style([
  link,
  { color: vars.color.brand, fontWeight: 600, marginTop: vars.space.sm },
])
export const empty = style({
  color: vars.color.textLight,
  fontSize: vars.fontSize.sm,
  margin: vars.space.sm,
})
