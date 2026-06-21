import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const ardoContent = style({})
const c = `.${ardoContent}`

globalStyle(`${c} h1, ${c} h2, ${c} h3, ${c} h4, ${c} h5, ${c} h6`, {
  fontFamily: vars.font.familyHeading,
  fontWeight: 600,
  lineHeight: 1.22,
  marginBottom: vars.space.md,
  letterSpacing: "-0.01em",
  maxWidth: vars.layout.contentMaxWidth,
  textWrap: "balance",
})

globalStyle(`${c} h1`, {
  fontSize: vars.fontSize["2xl"],
  fontWeight: 700,
  marginTop: vars.space["2xl"],
})

// h2 opens a major section — generous separation above.
globalStyle(`${c} h2`, {
  fontSize: "1.375rem",
  marginTop: vars.space["2xl"],
})

// h3/h4 are subsections — they live inside a section, so they sit closer.
globalStyle(`${c} h3`, {
  fontSize: vars.fontSize.lg,
  fontWeight: 600,
  marginTop: vars.space.xl,
})

globalStyle(`${c} h4`, {
  fontSize: vars.fontSize.sm,
  fontWeight: 600,
  marginTop: vars.space.lg,
})

globalStyle(`${c} h5, ${c} h6`, {
  marginTop: vars.space.lg,
})

// A heading directly after another heading is part of the same group —
// drop the section gap so they read as one unit, not two sections.
globalStyle(`${c} :is(h1,h2,h3,h4,h5,h6) + :is(h2,h3,h4,h5,h6)`, { marginTop: vars.space.sm })

// The first block in the content body sits right under the page title —
// no leading gap of its own.
globalStyle(`${c} > :first-child`, {
  marginTop: 0,
})

globalStyle(`${c} p`, {
  marginBottom: vars.space.lg,
  maxWidth: vars.layout.contentMaxWidth,
  fontSize: vars.fontSize.base,
  lineHeight: vars.font.lineHeight,
  overflowWrap: "break-word",
  textWrap: "pretty",
})

globalStyle(`${c} a`, {
  color: vars.color.brand,
  textDecoration: "underline",
  textDecorationColor: `color-mix(in oklch, ${vars.color.brand} 35%, transparent)`,
  textDecorationThickness: "1px",
  textUnderlineOffset: "3px",
  transition: `text-decoration-color ${vars.transition.fast}`,
})

globalStyle(`${c} a:hover`, {
  textDecorationColor: vars.color.brand,
})

globalStyle(`${c} ul, ${c} ol`, {
  marginBottom: vars.space.lg,
  paddingLeft: vars.space.lg,
  maxWidth: vars.layout.contentMaxWidth,
  textWrap: "pretty",
})

globalStyle(`${c} li`, {
  marginBottom: vars.space.xs,
  lineHeight: vars.font.lineHeight,
  overflowWrap: "break-word",
  textWrap: "pretty",
})

globalStyle(`${c} li::marker`, {
  color: vars.color.textLighter,
})

globalStyle(`${c} blockquote`, {
  margin: `${vars.space.lg} 0`,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderLeft: `3px solid ${vars.color.brand}`,
  background: vars.color.brandSubtle,
  borderRadius: `0 ${vars.radius.base} ${vars.radius.base} 0`,
  color: vars.color.text,
  fontSize: vars.fontSize.base,
  maxWidth: vars.layout.contentMaxWidth,
})

globalStyle(`${c} hr`, {
  margin: `${vars.space.xl} 0`,
  border: "none",
  borderTop: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} table`, {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  overflowX: "auto",
  margin: `${vars.space.lg} 0`,
  borderCollapse: "collapse",
  fontSize: vars.fontSize.sm,
  borderRadius: vars.radius.base,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
})

globalStyle(`${c} tbody, ${c} thead`, {
  width: "100%",
})

globalStyle(`${c} tr`, {
  display: "table-row",
})

globalStyle(`${c} thead`, {
  display: "table-header-group",
})

globalStyle(`${c} tbody`, {
  display: "table-row-group",
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
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.borderLight}`,
  borderRadius: vars.radius.sm,
  fontWeight: 500,
})

globalStyle(`${c} pre code`, {
  padding: 0,
  background: "none",
  border: "none",
  fontWeight: 400,
})
