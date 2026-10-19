import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

const MOBILE = "(max-width: 1024px)"
const DESKTOP = "(min-width: 1025px)"

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

const triggerBase = style({
  position: "relative",
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
    "&:focus-visible": {
      outline: `2px solid ${vars.color.ring}`,
      outlineOffset: "2px",
    },
  },
})

/** Icon button that opens the search overlay. Field variant: mobile only. */
export const trigger = style([
  triggerBase,
  {
    display: "none",
    "@media": {
      [MOBILE]: {
        display: "flex",
      },
    },
  },
])

/** Icon variant: the button is the only search entry point, at every width. */
export const triggerIcon = style([triggerBase, { display: "flex" }])

/** Shortcut hint below the icon button, shown on hover and keyboard focus. */
export const tooltip = style({
  position: "absolute",
  top: "calc(100% + 6px)",
  left: "50%",
  display: "flex",
  gap: "3px",
  padding: "4px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  boxShadow: vars.color.shadowSm,
  opacity: 0,
  pointerEvents: "none",
  transform: "translate(-50%, -2px)",
  transition: `opacity ${vars.transition.fast}, transform ${vars.transition.fast}`,
  whiteSpace: "nowrap",
  selectors: {
    [`${triggerBase}:hover &, ${triggerBase}:focus-visible &`]: {
      opacity: 1,
      transform: "translate(-50%, 0)",
    },
  },
  "@media": {
    "(hover: none)": {
      display: "none",
    },
  },
})

globalStyle(`${tooltip} kbd`, {
  padding: "1px 5px",
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.mono,
  lineHeight: 1.4,
  color: vars.color.textLight,
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

/** Full-width bar on phones; a centered panel on desktop (icon variant + ⌘K). */
export const overlayBar = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  "@media": {
    [DESKTOP]: {
      width: "min(40rem, calc(100% - 2rem))",
      margin: "12vh auto 0",
      padding: vars.space.sm,
      border: `1px solid ${vars.color.border}`,
      borderRadius: vars.radius.lg,
      boxShadow: vars.color.shadowLg,
    },
  },
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
