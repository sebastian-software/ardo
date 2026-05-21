import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

const MOBILE = "(max-width: 1024px)"

/** Inline search input — desktop only, hidden once the header collapses. */
export const inline = style({
  width: "100%",
  maxWidth: "26rem",
  "@media": {
    [MOBILE]: {
      display: "none",
    },
  },
})

/** Icon button that opens the search overlay — mobile only. */
export const trigger = style({
  display: "none",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  background: "none",
  border: "none",
  cursor: "pointer",
  borderRadius: vars.radius.base,
  color: vars.color.text,
  transition: `background ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
    },
  },
  "@media": {
    [MOBILE]: {
      display: "flex",
    },
  },
})

export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: 200,
  display: "flex",
  flexDirection: "column",
  background: `color-mix(in oklch, ${vars.color.bg} 88%, transparent)`,
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
})

export const overlayBar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
})

export const overlaySearch = style({
  flex: 1,
  minWidth: 0,
})

export const overlayClose = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  flexShrink: 0,
  background: "none",
  border: "none",
  cursor: "pointer",
  borderRadius: vars.radius.base,
  color: vars.color.textLight,
  transition: `background ${vars.transition.fast}, color ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
      color: vars.color.text,
    },
  },
})
