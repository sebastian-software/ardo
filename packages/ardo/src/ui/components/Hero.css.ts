import { globalStyle, style } from "@vanilla-extract/css"

import { fadeInUp } from "../theme/animations.css"
import { vars } from "../theme/contract.css"

const buttonShadow = `0 1px 2px oklch(0 0 0 / 0.08)`
const buttonShadowHover = `0 4px 12px oklch(0 0 0 / 0.12)`

export const hero = style({
  padding: "104px 24px 72px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  selectors: {
    // A single, quiet vertical wash — no brand glow. Reads as a calm
    // documentation surface rather than a marketing splash.
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(180deg, ${vars.color.bgSoft} 0%, ${vars.color.bg} 100%)`,
      pointerEvents: "none",
    },
  },
  "@media": {
    "(max-width: 768px)": {
      padding: "64px 20px 48px",
    },
  },
})

export const heroContainer = style({
  maxWidth: "800px",
  margin: "0 auto",
  position: "relative",
  zIndex: 1,
})

export const heroAnimate = style({
  animation: `${fadeInUp} 0.6s ease both`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animation: "none",
    },
  },
})

globalStyle(`${hero} img`, {
  maxWidth: "148px",
  marginBottom: "36px",
  filter: "drop-shadow(0 2px 10px oklch(0 0 0 / 0.08))",
})

export const heroVersion = style({
  display: "inline-block",
  padding: "4px 14px",
  fontSize: "13px",
  fontWeight: 600,
  color: vars.color.brand,
  background: vars.color.brandSubtle,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 20%, ${vars.color.border})`,
  borderRadius: "999px",
  marginBottom: "16px",
  letterSpacing: "0.02em",
})

export const heroName = style({
  fontSize: "58px",
  fontWeight: 800,
  color: vars.color.text,
  letterSpacing: "-0.035em",
  lineHeight: 1.1,
  textWrap: "balance",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "38px",
    },
  },
})

export const heroText = style({
  fontSize: "40px",
  fontWeight: 600,
  color: vars.color.textLight,
  marginTop: "10px",
  letterSpacing: "-0.02em",
  lineHeight: 1.18,
  textWrap: "balance",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "26px",
    },
  },
})

export const heroTagline = style({
  fontSize: "18px",
  color: vars.color.textLight,
  marginTop: "24px",
  maxWidth: "560px",
  marginLeft: "auto",
  marginRight: "auto",
  lineHeight: 1.65,
  textWrap: "pretty",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "16px",
    },
  },
})

export const heroActions = style({
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  marginTop: "40px",
  flexWrap: "wrap",
})

export const heroAction = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 28px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.base}`,
})

export const heroActionBrand = style({
  background: vars.color.brand,
  color: "white",
  boxShadow: buttonShadow,
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
      boxShadow: buttonShadowHover,
    },
  },
  "@media": {
    "(hover: hover)": {
      selectors: {
        "&:hover": {
          transform: "translateY(-2px)",
        },
      },
    },
    "(prefers-reduced-motion: reduce)": {
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
    },
  },
})

export const heroActionAlt = style({
  background: vars.color.bg,
  color: vars.color.text,
  border: `1px solid ${vars.color.border}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
      color: vars.color.brand,
    },
  },
})
