import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

/**
 * Shared look of Tabs and code-group tabs: a muted track holding compact
 * triggers, with the active one raised onto the page background. Modeled on
 * the shadcn/ui Tabs.
 */
export const segmentTrack = style({
  display: "flex",
  alignItems: "center",
  gap: "2px",
  padding: "3px",
  background: vars.color.bgMute,
  color: vars.color.textLight,
  overflowX: "auto",
  scrollbarWidth: "none",
})

export const segmentTrigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  minHeight: "28px",
  padding: "4px 12px",
  border: "1px solid transparent",
  borderRadius: `calc(${vars.radius.base} - 2px)`,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  font: "inherit",
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  lineHeight: 1.4,
  whiteSpace: "nowrap",
  transition: `color ${vars.transition.fast}, background-color ${vars.transition.fast}, box-shadow ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 3px ${vars.color.ring}`,
    },
    "&.active": {
      borderColor: vars.color.borderLight,
      background: vars.color.bg,
      color: vars.color.text,
      boxShadow: vars.color.shadowSm,
    },
    "&.active:focus-visible": {
      boxShadow: `${vars.color.shadowSm}, 0 0 0 3px ${vars.color.ring}`,
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
})
