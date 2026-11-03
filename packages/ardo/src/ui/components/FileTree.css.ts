import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

const brandTint = `color-mix(in oklch, ${vars.color.brand} 14%, transparent)`

export const fileTree = style({
  margin: `${vars.space.lg} 0`,
  maxWidth: "100%",
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.surfaceCard,
  boxShadow: vars.color.shadowSm,
  color: vars.color.text,
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
  overflowX: "auto",
})

/** Every list in the tree, including nested folders. */
export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  maxWidth: "none",
})

/** Nested folder contents. The left border draws the indentation guide. */
export const group = style({
  marginLeft: vars.space.xs,
  paddingLeft: vars.space.md,
  borderLeft: `1px solid ${vars.color.border}`,
})

export const item = style({
  margin: 0,
  padding: 0,
  minWidth: 0,
})

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  minHeight: "28px",
  padding: `0 ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
  overflowWrap: "anywhere",
})

export const highlighted = style({
  background: brandTint,
  boxShadow: `inset 2px 0 0 ${vars.color.brand}`,
  fontWeight: 700,
})

export const icon = style({
  flexShrink: 0,
  width: "16px",
  height: "16px",
  color: vars.color.textLight,
})

export const folderIcon = style({
  color: vars.color.brand,
})

export const name = style({
  minWidth: 0,
})

export const comment = style({
  color: vars.color.textLighter,
  fontFamily: vars.font.family,
  fontSize: vars.fontSize.xs,
})

// Content styles give every list a bullet and margin. Class selectors with the
// `.ardo-content` prefix outrank those element rules.
globalStyle(`.ardo-content ${list}`, {
  listStyle: "none",
  margin: 0,
  padding: 0,
  maxWidth: "none",
})

globalStyle(`.ardo-content ${item}`, {
  margin: 0,
  padding: 0,
  lineHeight: 1.6,
  overflowWrap: "normal",
  textWrap: "wrap",
})

globalStyle(`.ardo-content ${group}`, {
  marginLeft: vars.space.xs,
  paddingLeft: vars.space.md,
  borderLeft: `1px solid ${vars.color.border}`,
})
