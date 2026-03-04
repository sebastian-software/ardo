import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const filetree = style({
  margin: "24px 0",
  padding: "16px 20px",
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.8,
})

globalStyle(`${filetree} ul`, {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
})

globalStyle(`${filetree} ul ul`, {
  paddingLeft: "20px",
  borderLeft: `1px solid ${vars.color.border}`,
  marginLeft: "8px",
})

globalStyle(`${filetree} li`, {
  position: "relative",
  paddingLeft: "28px",
  marginBottom: 0,
})

// File icon
globalStyle(`${filetree} .ardo-filetree-file::before`, {
  content: '""',
  position: "absolute",
  left: "2px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "18px",
  height: "18px",
  background: vars.color.textLight,
  maskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z'/><path d='M14 2v5a1 1 0 0 0 1 1h5'/><path d='M10 9H8'/><path d='M16 13H8'/><path d='M16 17H8'/></svg>")`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
})

// Folder icon
globalStyle(`${filetree} .ardo-filetree-dir::before`, {
  content: '""',
  position: "absolute",
  left: "2px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "18px",
  height: "18px",
  background: vars.color.brand,
  maskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'/></svg>")`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
})

// Override inherited content styles
globalStyle(`.ardo-content ${filetree} ul`, {
  paddingLeft: 0,
  marginBottom: 0,
  maxWidth: "none",
})

globalStyle(`.ardo-content ${filetree} ul ul`, {
  paddingLeft: "20px",
})

globalStyle(`.ardo-content ${filetree} li`, {
  marginBottom: 0,
})

globalStyle(`.ardo-content ${filetree} li::marker`, {
  content: "none",
})
