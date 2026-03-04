import { style } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const docPage = style({
  display: "flex",
  maxWidth: `calc(${vars.layout.contentMaxWidth} + ${vars.layout.tocWidth})`,
  margin: "0 auto",
  paddingLeft: vars.layout.sidebarWidth,
  "@media": {
    "(max-width: 1024px)": {
      paddingLeft: 0,
    },
  },
})

export const contentContainer = style({
  flex: 1,
  maxWidth: vars.layout.contentMaxWidth,
  padding: "0 24px",
  paddingRight: `calc(${vars.layout.tocWidth} + 24px)`,
  "@media": {
    "(max-width: 1280px)": {
      paddingRight: "24px",
    },
  },
})

export const contentHeader = style({
  marginBottom: "40px",
  paddingBottom: "24px",
  borderBottom: `1px solid ${vars.color.border}`,
})

export const contentTitle = style({
  fontSize: "36px",
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  marginBottom: "12px",
})

export const contentDescription = style({
  fontSize: "18px",
  color: vars.color.textLight,
  lineHeight: 1.6,
})

export const contentBody = style({
  lineHeight: 1.75,
})
