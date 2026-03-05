import { globalStyle, style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

export const apiItem = style({
  margin: "28px 0",
  paddingBottom: "28px",
  borderBottom: `1px solid ${vars.color.border}`,
  selectors: {
    "&:last-child": {
      borderBottom: "none",
    },
  },
})

export const apiItemTitle = style({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
})

export const apiItemName = style({
  fontFamily: vars.font.mono,
  fontWeight: 600,
})

export const apiAnchor = style({
  color: vars.color.textLighter,
  textDecoration: "none",
  opacity: 0.4,
  transition: `opacity ${vars.transition.fast}`,
})

globalStyle(`${apiItemTitle}:hover ${apiAnchor}`, {
  opacity: 0.8,
})

export const apiItemDescription = style({
  color: vars.color.textLight,
  marginBottom: "16px",
  lineHeight: 1.6,
})

export const apiBadge = recipe({
  base: {
    display: "inline-flex",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderRadius: vars.radius.sm,
    border: "1px solid",
  },
  variants: {
    kind: {
      class: {
        background: "#eff6ff",
        borderColor: "#bfdbfe",
        color: "#1e40af",
        selectors: {
          ".dark &": { background: "#1e3a8a", borderColor: "#3b82f6", color: "#93c5fd" },
        },
      },
      interface: {
        background: "#ecfdf5",
        borderColor: "#a7f3d0",
        color: "#065f46",
        selectors: {
          ".dark &": { background: "#064e3b", borderColor: "#10b981", color: "#6ee7b7" },
        },
      },
      type: {
        background: "#fffbeb",
        borderColor: "#fde68a",
        color: "#92400e",
        selectors: {
          ".dark &": { background: "#78350f", borderColor: "#f59e0b", color: "#fcd34d" },
        },
      },
      enum: {
        background: "#f5f3ff",
        borderColor: "#ddd6fe",
        color: "#5b21b6",
        selectors: {
          ".dark &": { background: "#4c1d95", borderColor: "#8b5cf6", color: "#c4b5fd" },
        },
      },
      function: {
        background: "#fdf2f8",
        borderColor: "#fbcfe8",
        color: "#9d174d",
        selectors: {
          ".dark &": { background: "#831843", borderColor: "#ec4899", color: "#f9a8d4" },
        },
      },
      method: {
        background: "#f0f9ff",
        borderColor: "#bae6fd",
        color: "#0369a1",
        selectors: {
          ".dark &": { background: "#0c4a6e", borderColor: "#0ea5e9", color: "#7dd3fc" },
        },
      },
      property: {
        background: "#faf5ff",
        borderColor: "#e9d5ff",
        color: "#7c3aed",
        selectors: {
          ".dark &": { background: "#581c87", borderColor: "#a855f7", color: "#c4b5fd" },
        },
      },
    },
  },
})

export const apiSignature = style({
  margin: "16px 0",
})

export const apiSignatureCode = style({
  padding: "16px",
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.5,
})

export const apiKeyword = style({
  color: "#cf222e",
  selectors: { ".dark &": { color: "#ff7b72" } },
})

export const apiFunctionName = style({
  color: "#8250df",
  selectors: { ".dark &": { color: "#d2a8ff" } },
})

export const apiTypeParams = style({
  color: "#0550ae",
  selectors: { ".dark &": { color: "#79c0ff" } },
})

export const apiParams = style({
  color: vars.color.text,
})

export const apiReturnType = style({
  color: "#0550ae",
  selectors: { ".dark &": { color: "#79c0ff" } },
})

export const apiSectionTitle = style({
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: vars.color.textLighter,
  marginTop: "24px",
  marginBottom: "12px",
})

export const apiTable = style({
  width: "100%",
  margin: "12px 0",
  borderCollapse: "collapse",
  fontSize: "14px",
})

globalStyle(`${apiTable} th, ${apiTable} td`, {
  padding: "12px 14px",
  border: `1px solid ${vars.color.border}`,
  textAlign: "left",
})

globalStyle(`${apiTable} th`, {
  background: vars.color.bgSoft,
  fontWeight: 600,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: vars.color.textLighter,
})

globalStyle(`${apiTable} code`, {
  fontSize: "13px",
})

export const apiOptional = style({
  fontSize: "11px",
  color: vars.color.textLighter,
  marginLeft: "6px",
})

export const apiDefault = style({
  display: "block",
  marginTop: "4px",
  fontSize: "12px",
  color: vars.color.textLighter,
})

export const apiReturns = style({
  margin: "16px 0",
})

export const apiExamples = style({
  margin: "16px 0",
})

export const apiExample = style({
  margin: "8px 0",
  padding: "16px",
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: "14px",
})

export const apiSource = style({
  marginTop: "16px",
  fontSize: "12px",
  color: vars.color.textLighter,
})

globalStyle(`${apiSource} a`, {
  color: vars.color.brand,
  textDecoration: "none",
})

globalStyle(`${apiSource} a:hover`, {
  textDecoration: "underline",
})

export const apiHierarchy = style({
  margin: "16px 0",
})

export const apiHierarchyList = style({
  listStyle: "none",
  padding: 0,
})

globalStyle(`${apiHierarchyList} li`, {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "6px",
})

export const apiHierarchyLabel = style({
  fontSize: "12px",
  color: vars.color.textLighter,
  minWidth: "100px",
})

export const apiChildren = style({
  marginTop: "24px",
  paddingLeft: "20px",
  borderLeft: `2px solid ${vars.color.border}`,
})

export const apiParameters = style({
  margin: "16px 0",
})
