import { globalStyle, style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

export const apiItem = style({
  margin: `${vars.space.xl} 0`,
  paddingBottom: vars.space.xl,
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
  gap: "0.75rem",
  marginBottom: "0.75rem",
})

export const apiItemName = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.base,
  fontWeight: 700,
  letterSpacing: "-0.01em",
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
  marginBottom: vars.space.md,
  lineHeight: 1.6,
})

export const apiBadge = recipe({
  base: {
    display: "inline-flex",
    padding: "0.125rem 0.5rem",
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderRadius: vars.radius.sm,
    border: "1px solid",
  },
  variants: {
    kind: {
      class: {
        background: vars.color.badgeBlueBg,
        borderColor: vars.color.badgeBlueBorder,
        color: vars.color.badgeBlue,
      },
      interface: {
        background: vars.color.badgeGreenBg,
        borderColor: vars.color.badgeGreenBorder,
        color: vars.color.badgeGreen,
      },
      type: {
        background: vars.color.badgeAmberBg,
        borderColor: vars.color.badgeAmberBorder,
        color: vars.color.badgeAmber,
      },
      enum: {
        background: vars.color.badgePurpleBg,
        borderColor: vars.color.badgePurpleBorder,
        color: vars.color.badgePurple,
      },
      function: {
        background: vars.color.badgePinkBg,
        borderColor: vars.color.badgePinkBorder,
        color: vars.color.badgePink,
      },
      method: {
        background: vars.color.badgeBlueBg,
        borderColor: vars.color.badgeBlueBorder,
        color: vars.color.badgeBlue,
      },
      property: {
        background: vars.color.badgePurpleBg,
        borderColor: vars.color.badgePurpleBorder,
        color: vars.color.badgePurple,
      },
    },
  },
})

export const apiSignature = style({
  margin: `${vars.space.md} 0`,
})

export const apiSignatureCode = style({
  padding: `${vars.space.md} 1.25rem`,
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.base,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
})

export const apiKeyword = style({
  color: "oklch(0.55 0.2 25)",
  selectors: { ".dark &": { color: "oklch(0.75 0.15 25)" } },
})

export const apiFunctionName = style({
  color: "oklch(0.45 0.18 300)",
  selectors: { ".dark &": { color: "oklch(0.75 0.14 300)" } },
})

export const apiTypeParams = style({
  color: "oklch(0.45 0.14 250)",
  selectors: { ".dark &": { color: "oklch(0.72 0.12 250)" } },
})

export const apiParams = style({
  color: vars.color.text,
})

export const apiReturnType = style({
  color: "oklch(0.45 0.14 250)",
  selectors: { ".dark &": { color: "oklch(0.72 0.12 250)" } },
})

export const apiSectionTitle = style({
  fontSize: vars.fontSize.sm,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: vars.color.textLighter,
  marginTop: vars.space.lg,
  marginBottom: "0.75rem",
})

export const apiTable = style({
  width: "100%",
  margin: `0.75rem 0`,
  borderCollapse: "collapse",
  fontSize: vars.fontSize.sm,
  borderRadius: vars.radius.base,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
})

globalStyle(`${apiTable} th, ${apiTable} td`, {
  padding: `0.75rem ${vars.space.sm}`,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  textAlign: "left",
})

globalStyle(`${apiTable} th`, {
  background: vars.color.bgSoft,
  fontWeight: 600,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: vars.color.textLighter,
})

globalStyle(`${apiTable} code`, {
  fontSize: vars.fontSize.sm,
})

export const apiOptional = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
  marginLeft: vars.space.xs,
})

export const apiDefault = style({
  display: "block",
  marginTop: vars.space.xs,
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
})

export const apiReturns = style({
  margin: `${vars.space.md} 0`,
})

export const apiExamples = style({
  margin: `${vars.space.md} 0`,
})

export const apiExample = style({
  margin: `${vars.space.sm} 0`,
  padding: vars.space.md,
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.base,
  overflowX: "auto",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
})

export const apiSource = style({
  marginTop: vars.space.md,
  fontSize: vars.fontSize.xs,
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
  margin: `${vars.space.md} 0`,
})

export const apiHierarchyList = style({
  listStyle: "none",
  padding: 0,
})

globalStyle(`${apiHierarchyList} li`, {
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  marginBottom: vars.space.xs,
})

export const apiHierarchyLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
  minWidth: "6.25rem",
})

export const apiChildren = style({
  marginTop: vars.space.lg,
  paddingLeft: "1.25rem",
  borderLeft: `2px solid ${vars.color.border}`,
})

export const apiParameters = style({
  margin: `${vars.space.md} 0`,
})
