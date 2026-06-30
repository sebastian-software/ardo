import { globalStyle, style } from "@vanilla-extract/css"

import { fadeInUp } from "../theme/animations.css"
import { vars } from "../theme/contract.css"

const brandHalo = `color-mix(in oklch, ${vars.color.brand} 26%, transparent)`
const brandHaloStrong = `color-mix(in oklch, ${vars.color.brand} 36%, transparent)`
const brandPanel = `color-mix(in oklch, ${vars.color.brand} 7%, ${vars.color.bgSoft})`
const brandRule = `color-mix(in oklch, ${vars.color.brand} 18%, ${vars.color.border})`
const brandRuleStrong = `color-mix(in oklch, ${vars.color.brand} 32%, ${vars.color.border})`

export const hero = style({
  padding: "100px 24px 80px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, ${brandPanel} 100%)`,
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      inset: "28px clamp(20px, 6vw, 88px) auto",
      height: "1px",
      background: `linear-gradient(90deg, transparent, ${brandRuleStrong}, transparent)`,
      pointerEvents: "none",
    },
    ".dark &::before": {
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 10%, ${vars.color.bgSoft}) 100%)`,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      padding: "60px 20px",
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
  maxWidth: "180px",
  marginBottom: "40px",
  filter: "drop-shadow(0 4px 18px oklch(0 0 0 / 0.12))",
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
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 0.08em 0.08em",
  fontSize: "64px",
  fontWeight: 820,
  color: vars.color.brand,
  letterSpacing: "-0.035em",
  lineHeight: 1.05,
  textWrap: "balance",
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      left: "0.12em",
      right: "0.12em",
      bottom: 0,
      height: "0.12em",
      borderRadius: "999px",
      background: brandRule,
      zIndex: -1,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      fontSize: "40px",
    },
  },
})

export const heroText = style({
  fontSize: "48px",
  fontWeight: 720,
  marginTop: "12px",
  letterSpacing: "-0.025em",
  lineHeight: 1.12,
  textWrap: "balance",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "28px",
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
  boxShadow: `0 4px 14px ${brandHalo}`,
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
      boxShadow: `0 6px 20px ${brandHaloStrong}`,
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
