import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

// =============================================================================
// React CodeBlock component styles (used by ArdoCodeBlock via className props)
// =============================================================================

export const codeBlock = style({
  margin: "20px 0",
  marginLeft: "-16px",
  borderRadius: vars.radius.base,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
})

export const codeTitle = style({
  padding: "10px 16px",
  background: `linear-gradient(90deg, oklch(0.48 0.15 170 / 0.04) 0%, ${vars.color.codeBorder} 100%)`,
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

export const codeWrapper = style({
  position: "relative",
})

globalStyle(`${codeWrapper} pre`, {
  margin: 0,
  padding: "16px",
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.65,
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
  margin: "0 -16px",
  padding: "0 16px",
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
  width: "32px",
  color: vars.color.textLighter,
  textAlign: "right",
  marginRight: "16px",
  userSelect: "none",
  selectors: {
    ".dark &": {
      color: "#475569",
    },
  },
})

// =============================================================================
// Server-rendered shiki code blocks (raw HTML from markdown/shiki.ts)
//
// Single scoping class `.ardo-shiki` on the container; children are targeted
// via tag selectors and data attributes — no per-element class names needed.
//
// HTML structure:
//   .ardo-shiki
//     [data-title]         — optional title bar
//     div[data-lang]       — wrapper (position context for copy button)
//       pre > code > .line — Shiki output
//       button[data-code]  — copy button
// =============================================================================

const s = ".ardo-shiki"

globalStyle(s, {
  margin: "20px 0",
  marginLeft: "-16px",
  borderRadius: vars.radius.base,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
})

// Title bar
globalStyle(`${s} > [data-title]`, {
  padding: "10px 16px",
  background: `linear-gradient(90deg, oklch(0.48 0.15 170 / 0.04) 0%, ${vars.color.codeBorder} 100%)`,
  fontSize: "13px",
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

// Wrapper (positioning context for copy button)
globalStyle(`${s} > [data-lang]`, {
  position: "relative",
})

// Pre element
globalStyle(`${s} pre`, {
  margin: 0,
  padding: "16px",
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.65,
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
  margin: "0 -16px",
  padding: "0 16px",
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
  width: "32px",
  color: vars.color.textLighter,
  textAlign: "right",
  marginRight: "16px",
  userSelect: "none",
})

globalStyle(`.dark ${s} .line[data-ln]::before`, {
  color: "#475569",
})

// Copy button
globalStyle(`${s} button[data-code]`, {
  position: "absolute",
  top: "10px",
  right: "10px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  opacity: 0.6,
  transition: `all ${vars.transition.base}`,
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
  margin: "20px 0",
  marginLeft: "-16px",
  borderRadius: vars.radius.base,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
})

export const codeGroupTabs = style({
  display: "flex",
  background: vars.color.codeBorder,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

export const codeGroupTab = style({
  padding: "10px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
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
