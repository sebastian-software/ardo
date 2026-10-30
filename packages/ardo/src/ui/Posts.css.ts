import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const article = style({ padding: "3rem 1.5rem 4rem", width: "100%", minWidth: 0 })
export const heading = style({ maxWidth: "48rem", margin: "0 auto 2.5rem" })
export const back = style({
  color: vars.color.brand,
  display: "inline-block",
  marginBottom: "2rem",
  textDecoration: "none",
  fontWeight: 600,
})
export const date = style({
  color: vars.color.textLight,
  fontSize: "0.875rem",
  margin: "0 0 0.75rem",
})
export const title = style({
  color: vars.color.text,
  fontSize: "2.75rem",
  lineHeight: 1.15,
  fontWeight: 700,
  margin: "0 0 1.25rem",
  overflowWrap: "anywhere",
  "@media": { "(max-width: 40rem)": { fontSize: "2rem" } },
})
export const description = style({
  fontSize: "1.25rem",
  lineHeight: 1.6,
  color: vars.color.textLight,
  margin: "0 0 1.5rem",
  maxWidth: "38em",
})
export const authors = style({
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem 2rem",
})
export const author = style({
  display: "flex",
  alignItems: "flex-start",
  gap: "0.75rem",
  fontSize: "0.9375rem",
})
export const avatar = style({ borderRadius: "50%", objectFit: "cover", flexShrink: 0 })
export const authorTitle = style({ display: "block", color: vars.color.textLight, lineHeight: 1.5 })
export const authorBio = style({
  maxWidth: "32em",
  color: vars.color.textLight,
  lineHeight: 1.5,
  margin: "0.35rem 0",
})
export const authorLinks = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  fontSize: "0.875rem",
})
export const cover = style({ maxWidth: "56rem", margin: "0 auto 3rem" })
globalStyle(`${cover} img`, {
  display: "block",
  width: "100%",
  height: "auto",
  borderRadius: "0.5rem",
})
globalStyle(`${cover} figcaption`, {
  fontSize: "0.875rem",
  lineHeight: 1.6,
  color: vars.color.textLight,
  marginTop: "0.75rem",
})
export const body = style({
  maxWidth: "36em",
  margin: "0 auto",
  fontSize: "1.125rem",
  lineHeight: 1.8,
  overflowWrap: "anywhere",
})
globalStyle(`${body} img`, { maxWidth: "100%", height: "auto" })
export const postFooter = style({
  maxWidth: "40.5rem",
  margin: "3rem auto 0",
  paddingTop: "1.5rem",
  borderTop: `1px solid ${vars.color.divider}`,
  color: vars.color.textLight,
  fontSize: "0.9375rem",
})
export const tags = style({
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  listStyle: "none",
  padding: 0,
  margin: "0 0 1.5rem",
})
export const feeds = style({
  color: vars.color.textLight,
  fontSize: "0.875rem",
  margin: "1rem 0 0",
})
export const publication = style({
  maxWidth: "64rem",
  width: "100%",
  minWidth: 0,
  margin: "0 auto",
  padding: "3rem 1.5rem 4rem",
})
export const publicationHeader = style({ marginBottom: "3rem", maxWidth: "48rem" })
export const list = style({ listStyle: "none", margin: 0, padding: 0 })
export const listItem = style({ padding: "2rem 0", borderTop: `1px solid ${vars.color.divider}` })
export const preview = style({
  display: "flex",
  gap: "2rem",
  alignItems: "flex-start",
  "@media": { "(max-width: 40rem)": { flexDirection: "column", gap: "1.25rem" } },
})
export const thumbnail = style({
  display: "block",
  flex: "0 0 35%",
  width: "35%",
  "@media": { "(max-width: 40rem)": { width: "100%" } },
})
globalStyle(`${thumbnail} img`, {
  display: "block",
  width: "100%",
  height: "auto",
  borderRadius: "0.375rem",
})
export const previewTitle = style({ fontSize: "1.5rem", lineHeight: 1.3, margin: "0 0 0.75rem" })
globalStyle(`${previewTitle} a`, { color: vars.color.text, textDecoration: "none" })
globalStyle(`${previewTitle} a:hover`, { color: vars.color.brand, textDecoration: "underline" })
export const previewDescription = style({
  color: vars.color.textLight,
  lineHeight: 1.65,
  margin: "0 0 1rem",
})
