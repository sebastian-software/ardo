import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const ardoContent = style({})
const c = `.${ardoContent}`

globalStyle(`${c} h1, ${c} h2, ${c} h3, ${c} h4, ${c} h5, ${c} h6`, {
  fontWeight: 600,
  lineHeight: 1.3,
  marginTop: "40px",
  marginBottom: "16px",
  letterSpacing: "-0.01em",
})

globalStyle(`${c} h1`, { fontSize: "32px" })

globalStyle(`${c} h2`, {
  fontSize: "24px",
  paddingBottom: "10px",
  borderBottom: "none",
  position: "relative",
  letterSpacing: "-0.02em",
})

globalStyle(`${c} h2::after`, {
  content: '""',
  display: "block",
  width: "48px",
  height: "3px",
  background: vars.color.brand,
  borderRadius: "2px",
  marginTop: "10px",
})

globalStyle(`${c} h3`, { fontSize: "20px" })
globalStyle(`${c} h4`, { fontSize: "17px" })

globalStyle(`${c} p`, {
  marginBottom: "16px",
  maxWidth: "70ch",
})

globalStyle(`${c} a`, {
  color: vars.color.brand,
  textDecoration: "underline",
  textDecorationColor: "oklch(0.48 0.15 170 / 0.3)",
  textUnderlineOffset: "3px",
  transition: `text-decoration-color ${vars.transition.fast}`,
})

globalStyle(`${c} a:hover`, {
  textDecorationColor: vars.color.brand,
})

globalStyle(`.dark ${c} a`, {
  textDecorationColor: "oklch(0.65 0.16 170 / 0.3)",
})

globalStyle(`${c} ul, ${c} ol`, {
  marginBottom: "16px",
  paddingLeft: "24px",
  maxWidth: "70ch",
})

globalStyle(`${c} li`, {
  marginBottom: "8px",
})

globalStyle(`${c} li::marker`, {
  color: vars.color.textLighter,
})

globalStyle(`${c} blockquote`, {
  margin: "20px 0",
  padding: "16px 20px",
  borderLeft: `4px solid oklch(0.48 0.18 170)`,
  background: vars.color.bgSoft,
  borderRadius: `0 ${vars.radius.base} ${vars.radius.base} 0`,
  fontStyle: "italic",
  color: vars.color.textLight,
})

globalStyle(`${c} hr`, {
  margin: "40px 0",
  border: "none",
  borderTop: `1px solid ${vars.color.border}`,
})

globalStyle(`${c} table`, {
  width: "100%",
  margin: "20px 0",
  borderCollapse: "collapse",
  fontSize: "14px",
})

globalStyle(`${c} th, ${c} td`, {
  padding: "12px 16px",
  border: `1px solid ${vars.color.border}`,
  textAlign: "left",
})

globalStyle(`${c} th`, {
  background: vars.color.bgSoft,
  fontWeight: 600,
  fontSize: "13px",
})

globalStyle(`${c} tbody tr:nth-child(even)`, {
  background: vars.color.bgSoft,
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
  padding: "3px 6px",
  background: "oklch(0.48 0.15 170 / 0.06)",
  borderRadius: vars.radius.sm,
  border: "1px solid oklch(0.48 0.15 170 / 0.1)",
})

globalStyle(`${c} pre code`, {
  padding: 0,
  background: "none",
  border: "none",
})
