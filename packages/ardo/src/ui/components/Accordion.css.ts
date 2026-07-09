import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

const brandBorder = `color-mix(in oklch, ${vars.color.brand} 28%, ${vars.color.border})`
const brandRing = `color-mix(in oklch, ${vars.color.brand} 12%, transparent)`

export const accordionGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  margin: "24px 0",
})

export const accordion = style({
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg,
  boxShadow: vars.color.shadowSm,
  overflow: "hidden",
  transition: `border-color ${vars.transition.base}, box-shadow ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: brandBorder,
      boxShadow: `${vars.color.shadowSm}, 0 0 0 1px ${brandRing}`,
    },
  },
})

export const heading = style({
  margin: 0,
  font: "inherit",
})

export const trigger = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "16px 18px",
  border: 0,
  background: "transparent",
  color: vars.color.text,
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
  selectors: {
    "&:focus-visible": {
      outline: `2px solid ${vars.color.brand}`,
      outlineOffset: "-2px",
    },
  },
})

export const leadingIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.base,
  background: vars.color.brandSubtle,
  color: vars.color.brand,
})

export const title = style({
  flex: "1 1 auto",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  lineHeight: 1.4,
})

export const chevron = style({
  position: "relative",
  width: "16px",
  height: "16px",
  flex: "0 0 auto",
  transition: `transform ${vars.transition.base}`,
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "3px 2px 2px 2px",
      borderRight: `2px solid ${vars.color.textLight}`,
      borderBottom: `2px solid ${vars.color.textLight}`,
      transform: "rotate(45deg)",
    },
    // Base UI marks the open item with a bare data-open attribute
    [`${accordion}[data-open] &`]: {
      transform: "rotate(180deg)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
})

// Height animation follows the Base UI panel pattern: the panel is sized by
// --accordion-panel-height while open and collapses to 0 during enter/exit.
export const content = style({
  boxSizing: "border-box",
  height: `var(--accordion-panel-height)`,
  overflow: "hidden",
  // Transparent while closed: the hidden panel box could otherwise paint a 1px line
  borderTop: "1px solid transparent",
  opacity: 1,
  transition: `height ${vars.transition.base}, opacity ${vars.transition.base}, border-color ${vars.transition.base}`,
  selectors: {
    "&[data-open], &[data-ending-style]": {
      borderTopColor: vars.color.border,
    },
    "&[data-starting-style], &[data-ending-style]": {
      height: 0,
      opacity: 0,
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
})

export const contentInner = style({
  minHeight: 0,
  padding: "0 18px 16px",
  color: vars.color.textLight,
  fontSize: "14px",
  lineHeight: 1.65,
})
