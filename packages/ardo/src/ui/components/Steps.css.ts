import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const steps = style({
  margin: "24px 0",
})

globalStyle(`${steps} ol`, {
  listStyle: "none",
  paddingLeft: 0,
  counterReset: "ardo-step",
})

globalStyle(`${steps} ol > li`, {
  position: "relative",
  paddingLeft: "48px",
  paddingBottom: "24px",
  counterIncrement: "ardo-step",
  marginBottom: 0,
})

globalStyle(`${steps} ol > li:last-child`, {
  paddingBottom: 0,
})

// Step number badge
globalStyle(`${steps} ol > li::before`, {
  content: "counter(ardo-step)",
  position: "absolute",
  left: 0,
  top: "2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: vars.color.brand,
  color: "white",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1,
  flexShrink: 0,
})

// Vertical connecting line
globalStyle(`${steps} ol > li::after`, {
  content: '""',
  position: "absolute",
  left: "15px",
  top: "38px",
  bottom: 0,
  width: "2px",
  background: vars.color.border,
})

globalStyle(`${steps} ol > li:last-child::after`, {
  display: "none",
})

// Override inherited content styles
globalStyle(`.ardo-content ${steps} ol`, {
  paddingLeft: 0,
  maxWidth: "none",
})

globalStyle(`.ardo-content ${steps} ol > li`, {
  paddingLeft: "48px",
  marginBottom: 0,
})

globalStyle(`.ardo-content ${steps} ol > li::marker`, {
  content: "none",
})
