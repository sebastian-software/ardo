import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"
import { fadeInUp } from "../theme/animations.css"

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
      background: `radial-gradient(ellipse 60% 50% at 30% 0%, oklch(0.48 0.15 200 / 0.06) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 70% -10%, oklch(0.48 0.15 170 / 0.12) 0%, transparent 70%), linear-gradient(180deg, ${vars.color.bg} 0%, ${vars.color.bgSoft} 100%)`,
      pointerEvents: "none",
    },
    ".dark &::before": {
      background: `radial-gradient(ellipse 60% 50% at 30% 0%, oklch(0.65 0.16 200 / 0.1) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 70% -10%, oklch(0.65 0.16 170 / 0.2) 0%, transparent 70%), linear-gradient(180deg, ${vars.color.bg} 0%, ${vars.color.bgSoft} 100%)`,
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
  filter: "drop-shadow(0 4px 20px oklch(0.48 0.15 170 / 0.15))",
})

export const heroVersion = style({
  display: "inline-block",
  padding: "4px 14px",
  fontSize: "13px",
  fontWeight: 600,
  color: vars.color.brand,
  background: vars.color.brandSubtle,
  border: "1px solid oklch(0.48 0.15 170 / 0.15)",
  borderRadius: "999px",
  marginBottom: "16px",
  letterSpacing: "0.02em",
})

export const heroName = style({
  fontSize: "64px",
  fontWeight: 800,
  background: vars.color.brandGradient,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  "@media": {
    "(max-width: 768px)": {
      fontSize: "40px",
    },
  },
})

export const heroText = style({
  fontSize: "48px",
  fontWeight: 700,
  marginTop: "8px",
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
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
  boxShadow: "0 4px 14px oklch(0.48 0.15 170 / 0.3)",
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
      boxShadow: "0 6px 20px oklch(0.48 0.15 170 / 0.4)",
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
