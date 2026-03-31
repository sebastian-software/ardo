import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const ardoContent = style({})
const c = `.${ardoContent}`

globalStyle(`${c} h1, ${c} h2, ${c} h3, ${c} h4, ${c} h5, ${c} h6`, {
  fontFamily: vars.font.familyHeading,
  fontWeight: 600,
  lineHeight: 1.3,
  marginTop: vars.space.xl,
  marginBottom: vars.space.sm,
  letterSpacing: "-0.02em",
})

globalStyle(`${c} h1`, {
  fontSize: vars.fontSize["2xl"],
  fontWeight: 700,
  marginTop: vars.space["2xl"],
})

globalStyle(`${c} h2`, {
  fontSize: vars.fontSize.xl,
  paddingTop: vars.space.sm,
  letterSpacing: "-0.015em",
})

globalStyle(`${c} h3`, {
  fontSize: vars.fontSize.base,
  fontWeight: 600,
})

globalStyle(`${c} h4`, {
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
})

globalStyle(`${c} p`, {
  marginBottom: vars.space.md,
  maxWidth: "68ch",
})

globalStyle(`${c} a`, {
  color: vars.color.brand,
  textDecoration: "underline",
  textDecorationColor: "transparent",
  textDecorationThickness: "1px",
  textUnderlineOffset: "2px",
  transition: `text-decoration-color ${vars.transition.fast}`,
})

globalStyle(`${c} a:hover`, {
  textDecorationColor: vars.color.brand,
})

globalStyle(`${c} ul, ${c} ol`, {
  marginBottom: vars.space.md,
  paddingLeft: vars.space.lg,
  maxWidth: "68ch",
})

globalStyle(`${c} li`, {
  marginBottom: vars.space.xs,
})

globalStyle(`${c} li::marker`, {
  color: vars.color.textLighter,
})

globalStyle(`${c} blockquote`, {
  margin: `${vars.space.lg} 0`,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderLeft: `3px solid ${vars.color.brand}`,
  background: vars.color.bgSoft,
  borderRadius: `0 ${vars.radius.base} ${vars.radius.base} 0`,
  color: vars.color.text,
  fontSize: vars.fontSize.base,
})

globalStyle(`${c} hr`, {
  margin: `${vars.space.xl} 0`,
  border: "none",
  borderTop: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} table`, {
  width: "100%",
  margin: `${vars.space.lg} 0`,
  borderCollapse: "collapse",
  fontSize: vars.fontSize.sm,
  borderRadius: vars.radius.base,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} th, ${c} td`, {
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  textAlign: "left",
})

globalStyle(`${c} th`, {
  background: vars.color.bgSoft,
  fontWeight: 600,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
})

globalStyle(`${c} img`, {
  maxWidth: "100%",
  borderRadius: vars.radius.base,
  border: `1px solid ${vars.color.border}`,
})

// Inline code
globalStyle(`${c} code`, {
  fontFamily: vars.font.mono,
  fontSize: "0.875em",
  padding: "0.125rem 0.375rem",
  background: vars.color.bgMute,
  borderRadius: vars.radius.sm,
  fontWeight: 500,
})

globalStyle(`${c} pre code`, {
  padding: 0,
  background: "none",
  border: "none",
  fontWeight: 400,
})
