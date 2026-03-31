import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const ardoContent = style({})
const c = `.${ardoContent}`

globalStyle(`${c} h1, ${c} h2, ${c} h3, ${c} h4, ${c} h5, ${c} h6`, {
  fontFamily: vars.font.familyHeading,
  fontWeight: 700,
  lineHeight: 1.25,
  marginTop: vars.space.section,
  marginBottom: vars.space.md,
  letterSpacing: "-0.02em",
})

globalStyle(`${c} h1`, {
  fontSize: `clamp(1.75rem, 4vw, ${vars.fontSize["3xl"]})`,
})

globalStyle(`${c} h2`, {
  fontSize: `clamp(1.375rem, 3vw, 1.75rem)`,
  paddingBottom: "0.75rem",
  borderBottom: "none",
  position: "relative",
  letterSpacing: "-0.025em",
})

globalStyle(`${c} h2::after`, {
  content: '""',
  display: "block",
  width: "2.5rem",
  height: "2.5px",
  background: vars.color.brand,
  borderRadius: "2px",
  marginTop: "0.75rem",
  opacity: 0.7,
})

globalStyle(`${c} h3`, {
  fontSize: `clamp(${vars.fontSize.lg}, 2.5vw, 1.375rem)`,
})

globalStyle(`${c} h4`, {
  fontSize: vars.fontSize.lg,
  fontWeight: 600,
})

globalStyle(`${c} p`, {
  marginBottom: vars.space.lg,
  maxWidth: "68ch",
})

globalStyle(`${c} a`, {
  color: vars.color.brand,
  textDecoration: "underline",
  textDecorationColor: "transparent",
  textDecorationThickness: "1.5px",
  textUnderlineOffset: "3px",
  transition: `text-decoration-color ${vars.transition.fast}`,
})

globalStyle(`${c} a:hover`, {
  textDecorationColor: vars.color.brand,
})

globalStyle(`${c} ul, ${c} ol`, {
  marginBottom: vars.space.lg,
  paddingLeft: "1.75rem",
  maxWidth: "68ch",
})

globalStyle(`${c} li`, {
  marginBottom: vars.space.sm,
})

globalStyle(`${c} li::marker`, {
  color: vars.color.textLighter,
})

globalStyle(`${c} blockquote`, {
  margin: `${vars.space.content} 0`,
  padding: `1.25rem ${vars.space.lg}`,
  borderLeft: `3px solid ${vars.color.brand}`,
  background: vars.color.bgSoft,
  borderRadius: `0 ${vars.radius.base} ${vars.radius.base} 0`,
  color: vars.color.text,
  fontSize: vars.fontSize.base,
})

globalStyle(`${c} hr`, {
  margin: `${vars.space.section} 0`,
  border: "none",
  borderTop: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} table`, {
  width: "100%",
  margin: `${vars.space.content} 0`,
  borderCollapse: "collapse",
  fontSize: vars.fontSize.sm,
  borderRadius: vars.radius.base,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} th, ${c} td`, {
  padding: `0.75rem ${vars.space.md}`,
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
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowSm,
})

// Inline code
globalStyle(`${c} code`, {
  fontFamily: vars.font.mono,
  fontSize: "0.85em",
  padding: "0.125rem 0.375rem",
  background: vars.color.brandSubtle,
  borderRadius: vars.radius.sm,
  border: `1px solid ${vars.color.borderLight}`,
  fontWeight: 500,
})

globalStyle(`${c} pre code`, {
  padding: 0,
  background: "none",
  border: "none",
  fontWeight: 400,
})
