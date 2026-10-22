import { globalStyle, style } from "@vanilla-extract/css"

export const frame = style({
  position: "relative",
  margin: "var(--ardo-space-lg) 0",
  padding: "var(--ardo-space-md) var(--ardo-space-lg)",
  paddingRight: "calc(var(--ardo-space-lg) + 6rem)",
  border: "1px solid var(--ardo-color-border)",
  borderRadius: "var(--ardo-radius-lg)",
  background: "var(--ardo-color-bgSoft)",
})

export const prompt = style({
  margin: 0,
  fontFamily: "var(--ardo-font-mono)",
  fontSize: "var(--ardo-fontSize-sm)",
  lineHeight: 1.6,
  color: "var(--ardo-color-text)",
})

// The copy button hides until its code block is hovered; the prompt box
// always shows it.
globalStyle(`${frame} .ardo-copy-button`, { opacity: 1 })
