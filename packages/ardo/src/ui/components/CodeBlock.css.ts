import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"
import { shikiContainerClassName } from "./code-block-classes"
import { copyButton } from "./CopyButton.css"

// =============================================================================
// React CodeBlock component styles
// =============================================================================

export const codeBlock = style({
  margin: `${vars.space.lg} 0`,
  maxWidth: "120ch",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
})

export const codeTitle = style({
  padding: `${vars.space.smd} ${vars.space.md}`,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  background: `color-mix(in oklch, ${vars.color.accentSubtle} 50%, ${vars.color.bgSoft})`,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

export const codeWrapper = style({
  position: "relative",
})

// Reveal the React CopyButton when the code block is hovered or focused.
globalStyle(`${codeWrapper}:hover .${copyButton}, ${codeWrapper}:focus-within .${copyButton}`, {
  opacity: 1,
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
      background: `color-mix(in oklch, ${vars.color.brand} 11%, transparent)`,
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
  padding: `${vars.space.smd} ${vars.space.md}`,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  fontFamily: vars.font.mono,
  color: vars.color.textLight,
  background: `color-mix(in oklch, ${vars.color.accentSubtle} 50%, ${vars.color.bgSoft})`,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
})

globalStyle(s, {
  margin: `${vars.space.lg} 0`,
  maxWidth: "120ch",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
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
  background: `color-mix(in oklch, ${vars.color.brand} 11%, transparent)`,
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

// Copy button - hidden by default, shown when the block is hovered or focused
globalStyle(`${s} button[data-code]`, {
  position: "absolute",
  top: vars.space.sm,
  right: vars.space.sm,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  background: vars.color.bg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  opacity: 0,
  transition: `opacity ${vars.transition.base}, border-color ${vars.transition.fast}, color ${vars.transition.fast}`,
})

globalStyle(`${s}:hover button[data-code], ${s}:focus-within button[data-code]`, {
  opacity: 1,
})

globalStyle(`${s} button[data-code]:hover, ${s} button[data-code]:focus-visible`, {
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
  margin: `${vars.space.lg} 0`,
  maxWidth: "120ch",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  boxShadow: vars.color.codeShadow,
})

export const codeGroupTabs = style({
  display: "flex",
  background: vars.color.bgSoft,
  borderBottom: `1px solid ${vars.color.codeBorder}`,
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
      color: vars.color.accent,
      borderBottomColor: vars.color.accent,
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
