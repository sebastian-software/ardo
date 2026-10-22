import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

export const copyText = style({})

export const copyButton = style({
  position: "absolute",
  top: vars.space.sm,
  right: vars.space.sm,
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: vars.font.family,
  color: vars.color.textLight,
  // Hidden by default; revealed when the enclosing code block is hovered
  // or focused (handled in CodeBlock.css.ts via a global selector).
  opacity: 0,
  transition: `opacity ${vars.transition.base}, border-color ${vars.transition.fast}, color ${vars.transition.fast}`,
  selectors: {
    "&:hover, &:focus-visible": {
      opacity: 1,
      borderColor: vars.color.brand,
      color: vars.color.brand,
    },
  },
})

export const copyStatus = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
})

export const copyError = style({
  borderTop: `1px solid ${vars.color.codeBorder}`,
  padding: `${vars.space.md} ${vars.space.md} ${vars.space.sm}`,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
  color: vars.color.text,
})

export const copyRecovery = style({
  padding: `0 ${vars.space.md} ${vars.space.md}`,
})

export const manualCode = style({
  display: "block",
  width: "100%",
  maxHeight: "20rem",
  padding: vars.space.sm,
  resize: "vertical",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
  color: vars.color.text,
  background: vars.color.bg,
  border: `1px solid ${vars.color.codeBorder}`,
  borderRadius: vars.radius.sm,
  selectors: {
    "&:focus-visible": { outline: `2px solid ${vars.color.ring}`, outlineOffset: "2px" },
  },
})
