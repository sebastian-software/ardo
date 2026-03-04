import { style } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const homeSection = style({
  padding: "80px 24px",
  "@media": {
    "(max-width: 768px)": {
      padding: "48px 16px",
    },
  },
})

export const homeSectionAlt = style({
  background: vars.color.bgSoft,
})

export const homeSectionContainer = style({
  maxWidth: "1100px",
  margin: "0 auto",
})

export const homeSectionTitle = style({
  fontSize: "36px",
  fontWeight: 700,
  textAlign: "center",
  letterSpacing: "-0.02em",
  marginBottom: "12px",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "28px",
    },
  },
})

export const homeSectionSubtitle = style({
  fontSize: "18px",
  color: vars.color.textLight,
  textAlign: "center",
  maxWidth: "560px",
  margin: "0 auto 48px",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "16px",
      marginBottom: "32px",
    },
  },
})
