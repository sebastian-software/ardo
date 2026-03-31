import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"
import { shikiContainerClassName } from "./code-block-classes"

// =============================================================================
// React CodeBlock component styles
// =============================================================================

export const codeBlock = style({
  margin: `${vars.space.md} 0`,
  maxWidth: "120ch",
  borderRadius: vars.radius.base,
  overflow: "hidden",
  background: vars.color.bgSoft,
})

export const codeTitle = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLighter,
  borderBottom: `1px solid ${vars.color.borderLight}`,
})

export const codeWrapper = style({
  position: "relative",
})

globalStyle(`${codeWrapper} pre`, {
  margin: 0,
  padding: vars.space.md,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  color: vars.color.text,
  background: "transparent !important",
})

globalStyle(`.dark ${codeWrapper} pre`, {
  color: "#e2e8f0",
})

globalStyle(`${codeWrapper} pre code`, {
  display: "flex",
  flexDirection: "column",
})

globalStyle(`${codeWrapper} pre code .line`, {
  minHeight: "1lh",
})

export const codeLine = style({
  display: "block",
  margin: `0 -${vars.space.md}`,
  padding: `0 ${vars.space.md}`,
  borderLeft: "3px solid transparent",
  selectors: {
    "&.highlighted": {
      background: "oklch(0.48 0.15 170 / 0.08)",
      borderLeftColor: vars.color.brand,
    },
  },
})

export const lineNumber = style({
  display: "inline-block",
  width: "2rem",
  color: vars.color.textLighter,
  textAlign: "right",
  marginRight: vars.space.md,
  userSelect: "none",
  selectors: {
    ".dark &": {
      color: "#475569",
    },
  },
})

// =============================================================================
// Server-rendered shiki code blocks
// =============================================================================

const s = `.${shikiContainerClassName}`

globalStyle(`${s} > [data-title]`, {
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLighter,
  borderBottom: `1px solid ${vars.color.borderLight}`,
})

globalStyle(`${s} > [data-lang]`, {
  position: "relative",
})

globalStyle(`${s} pre`, {
  margin: 0,
  padding: vars.space.md,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.7,
  color: vars.color.text,
  background: "transparent !important",
})

globalStyle(`.dark ${s} pre`, {
  color: "#e2e8f0",
})

globalStyle(`${s} pre code`, {
  display: "flex",
  flexDirection: "column",
})

globalStyle(`${s} .line`, {
  display: "block",
  minHeight: "1lh",
  margin: `0 -${vars.space.md}`,
  padding: `0 ${vars.space.md}`,
  borderLeft: "3px solid transparent",
})

globalStyle(`${s} .line.highlighted`, {
  background: "oklch(0.48 0.15 170 / 0.08)",
  borderLeftColor: vars.color.brand,
})

globalStyle(`${s} .line[data-ln]::before`, {
  content: "attr(data-ln)",
  display: "inline-block",
  width: "2rem",
  color: vars.color.textLighter,
  textAlign: "right",
  marginRight: vars.space.md,
  userSelect: "none",
})

globalStyle(`.dark ${s} .line[data-ln]::before`, {
  color: "#475569",
})

// Copy button - hidden by default, shown on hover
globalStyle(`${s} button[data-code]`, {
  position: "absolute",
  top: vars.space.sm,
  right: vars.space.sm,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  opacity: 0,
  transition: `all ${vars.transition.base}`,
})

globalStyle(`${s}:hover button[data-code]`, {
  opacity: 1,
})

globalStyle(`${s} button[data-code]:hover`, {
  opacity: 1,
  borderColor: vars.color.brand,
  color: vars.color.brand,
})

// =============================================================================
// Shiki theme integration
// =============================================================================

globalStyle(".shiki", {
  background: "transparent !important",
})

globalStyle(".shiki span", {
  color: "var(--shiki-light)",
})

globalStyle(".dark .shiki span", {
  color: "var(--shiki-dark)",
})

// =============================================================================
// Code group styles
// =============================================================================

export const codeGroup = style({
  margin: `${vars.space.md} 0`,
  maxWidth: "120ch",
  borderRadius: vars.radius.base,
  overflow: "hidden",
  background: vars.color.bgSoft,
})

export const codeGroupTabs = style({
  display: "flex",
  borderBottom: `1px solid ${vars.color.borderLight}`,
})

export const codeGroupTab = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: vars.fontSize.sm,
  fontFamily: vars.font.mono,
  color: vars.color.textLighter,
  borderBottom: "2px solid transparent",
  marginBottom: "-1px",
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
      borderBottomColor: vars.color.brand,
    },
  },
})

export const codeGroupPanels = style({})

export const codeGroupPanel = style({})

globalStyle(`${codeGroupPanel} ${codeBlock}`, {
  margin: 0,
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  background: "transparent",
})
