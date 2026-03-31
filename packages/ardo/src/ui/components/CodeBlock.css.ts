import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"
import { shikiContainerClassName } from "./code-block-classes"

// =============================================================================
// React CodeBlock component styles (used by ArdoCodeBlock via className props)
// =============================================================================

export const codeBlock = style({
  margin: `${vars.space.content} 0`,
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: "0 2px 0.5rem oklch(0 0 0 / 0.04), 0 0 0 1px oklch(0 0 0 / 0.03)",
})

export const codeTitle = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.bgSoft,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
  letterSpacing: "0.01em",
})

export const codeWrapper = style({
  position: "relative",
})

globalStyle(`${codeWrapper} pre`, {
  margin: 0,
  padding: "1.25rem",
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
  margin: "0 -1.25rem",
  padding: "0 1.25rem",
  borderLeft: "3px solid transparent",
  selectors: {
    "&.highlighted": {
      background: "oklch(0.48 0.15 170 / 0.1)",
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
// Server-rendered shiki code blocks (raw HTML from markdown/shiki.ts)
// =============================================================================

const s = `.${shikiContainerClassName}`

// Title bar
globalStyle(`${s} > [data-title]`, {
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.bgSoft,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
  letterSpacing: "0.01em",
})

// Wrapper (positioning context for copy button)
globalStyle(`${s} > [data-lang]`, {
  position: "relative",
})

// Pre element
globalStyle(`${s} pre`, {
  margin: 0,
  padding: "1.25rem",
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

// Lines (Shiki adds .line by default)
globalStyle(`${s} .line`, {
  display: "block",
  minHeight: "1lh",
  margin: "0 -1.25rem",
  padding: "0 1.25rem",
  borderLeft: "3px solid transparent",
})

globalStyle(`${s} .line.highlighted`, {
  background: "oklch(0.48 0.15 170 / 0.1)",
  borderLeftColor: vars.color.brand,
})

// Line numbers via data attribute
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
  background: "oklch(1 0 0 / 0.8)",
  backdropFilter: "blur(8px)",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  opacity: 0,
  transition: `all ${vars.transition.base}`,
})

globalStyle(`.dark ${s} button[data-code]`, {
  background: "oklch(0.14 0 0 / 0.8)",
})

globalStyle(`${s}:hover button[data-code]`, {
  opacity: 1,
})

globalStyle(`${s} button[data-code]:hover`, {
  opacity: 1,
  background: vars.color.bgSoft,
  borderColor: vars.color.brand,
  color: vars.color.brand,
})

// =============================================================================
// Shiki theme integration (shared by both paths)
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
  margin: `${vars.space.content} 0`,
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: "0 2px 0.5rem oklch(0 0 0 / 0.04), 0 0 0 1px oklch(0 0 0 / 0.03)",
})

export const codeGroupTabs = style({
  display: "flex",
  background: vars.color.codeBorder,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

export const codeGroupTab = style({
  padding: `0.75rem ${vars.space.md}`,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: vars.fontSize.sm,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
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
      background: vars.color.codeBg,
    },
  },
})

export const codeGroupPanels = style({})

export const codeGroupPanel = style({})

// Strip inner code-block chrome when nested inside a code group
globalStyle(`${codeGroupPanel} ${codeBlock}`, {
  margin: 0,
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  background: "transparent",
})
