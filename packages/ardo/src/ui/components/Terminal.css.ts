import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const homeTerminal = style({
  maxWidth: "600px",
  margin: "0 auto",
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  background: "#1e1e1e",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
  selectors: {
    ".dark &": {
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    },
  },
})

export const homeTerminalHeader = style({
  display: "flex",
  gap: "8px",
  padding: "14px 16px",
  background: "#323232",
})

export const homeTerminalDot = style({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "#ff5f56",
  selectors: {
    "&:nth-child(2)": {
      background: "#ffbd2e",
    },
    "&:nth-child(3)": {
      background: "#27ca40",
    },
  },
})

export const homeTerminalBody = style({
  padding: "20px 24px",
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.8,
  color: "#e0e0e0",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "12px",
      padding: "16px",
    },
  },
})

globalStyle(`${homeTerminalBody} .ardo-home-terminal-prompt`, {
  color: "#27ca40",
  marginRight: "8px",
})

globalStyle(`${homeTerminalBody} .ardo-home-terminal-success`, {
  color: "#27ca40",
})

globalStyle(`${homeTerminalBody} .ardo-home-terminal-link`, {
  color: "#61afef",
})
