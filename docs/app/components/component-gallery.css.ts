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
