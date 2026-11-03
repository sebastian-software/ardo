import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const pageActions = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: `${vars.space.xs} ${vars.space.md}`,
  marginTop: vars.space.md,
  fontSize: vars.fontSize.sm,
})

export const action = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: 0,
  background: "none",
  border: 0,
  cursor: "pointer",
  font: "inherit",
  color: vars.color.textLight,
  textDecoration: "none",
  transition: `color ${vars.transition.fast}`,
  selectors: {
    "&:hover": { color: vars.color.accent },
    "&:focus-visible": { outline: `2px solid ${vars.color.ring}`, outlineOffset: "2px" },
  },
})

// Visually hidden until a copy fails, so the live region is in the DOM when it changes.
export const statusHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
})

export const statusError = style({
  flexBasis: "100%",
  color: vars.color.text,
})
