import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

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

// Shiki integration
globalStyle(".shiki", {
  background: "transparent !important",
})

globalStyle(".shiki span", {
  color: "var(--shiki-light)",
})

globalStyle(".dark .shiki span", {
  color: "var(--shiki-dark)",
})

// Code group styles
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

// Strip inner code-block chrome when nested inside a code group
globalStyle(`.ardo-code-group-panel ${codeBlock}`, {
  margin: 0,
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  background: "transparent",
})
