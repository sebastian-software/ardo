import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

export const preview = style({
  minWidth: 0,
  marginBlock: vars.space.lg,
  padding: vars.space.lg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg,
  scrollMarginTop: `calc(${vars.layout.headerHeight} + ${vars.space.lg})`,
  "@media": {
    "(max-width: 640px)": { padding: vars.space.md },
  },
})

// The stage's padding sets the inset; the example's own block margins would double it.
globalStyle(`${preview} > :first-child, ${preview} > :first-child > :first-child`, {
  marginTop: 0,
})
globalStyle(`${preview} > :last-child, ${preview} > :last-child > :last-child`, {
  marginBottom: 0,
})

export const barePreview = style({
  minWidth: 0,
  scrollMarginTop: `calc(${vars.layout.headerHeight} + ${vars.space.lg})`,
})

export const iconGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))",
  gap: vars.space.sm,
  padding: 0,
  listStyle: "none",
})

export const iconItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
  minWidth: 0,
  padding: vars.space.sm,
  borderBottom: `1px solid ${vars.color.borderLight}`,
})

export const iconSamples = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  flexShrink: 0,
  color: vars.color.textLight,
})

export const iconName = style({
  overflowWrap: "anywhere",
  fontSize: vars.fontSize.xs,
})

globalStyle(`${iconGrid} > li`, { margin: 0 })

// The compare slider example shows the hero illustration on the page color of each theme.
const comparePanel = style({
  display: "flex",
  justifyContent: "center",
  padding: `${vars.space.lg} ${vars.space.md}`,
})

export const compareLight = style([
  comparePanel,
  { background: `oklch(0.985 0.004 ${vars.hue.neutral})` },
])

export const compareDark = style([
  comparePanel,
  { background: `oklch(0.17 0.012 ${vars.hue.neutral})` },
])

globalStyle(`${comparePanel} > img`, {
  display: "block",
  width: "min(100%, 320px)",
  height: "auto",
  margin: 0,
  border: 0,
  borderRadius: 0,
  boxShadow: "none",
})
