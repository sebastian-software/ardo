import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const root = style({
  minHeight: "calc(100vh - 6rem)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `${vars.space["3xl"]} ${vars.space.lg}`,
})

export const card = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  maxWidth: "32rem",
})

export const owl = style({
  color: vars.color.brand,
  opacity: 0.85,
  marginBottom: vars.space.lg,
})

export const status = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: vars.color.textLighter,
  marginBottom: vars.space.sm,
})

export const title = style({
  fontSize: "clamp(1.5rem, 3vw, 2rem)",
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: "-0.01em",
  color: vars.color.text,
  marginBottom: vars.space.sm,
  textWrap: "balance",
})

export const description = style({
  fontSize: vars.fontSize.base,
  lineHeight: 1.6,
  color: vars.color.textLight,
  marginBottom: vars.space.xl,
  textWrap: "pretty",
})

export const actions = style({
  display: "flex",
  gap: vars.space.sm,
  flexWrap: "wrap",
  justifyContent: "center",
})

export const primaryAction = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `0.625rem ${vars.space.lg}`,
  background: vars.color.brand,
  color: vars.color.bg,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  transition: `background ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
    },
  },
})

export const secondaryAction = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `0.625rem ${vars.space.lg}`,
  background: "transparent",
  color: vars.color.text,
  fontSize: vars.fontSize.sm,
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  border: `1px solid ${vars.color.border}`,
  transition: `border-color ${vars.transition.fast}, background ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
      background: vars.color.bgSoft,
    },
  },
})

export const details = style({
  marginTop: vars.space.xl,
  width: "100%",
  textAlign: "left",
  fontSize: vars.fontSize.xs,
  color: vars.color.textLight,
})

export const detailsSummary = style({
  cursor: "pointer",
  color: vars.color.textLighter,
  marginBottom: vars.space.sm,
  selectors: {
    "&:hover": { color: vars.color.text },
  },
})

export const detailsPre = style({
  margin: 0,
  padding: vars.space.md,
  background: vars.color.codeBg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.base,
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xs,
  lineHeight: 1.5,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
})
