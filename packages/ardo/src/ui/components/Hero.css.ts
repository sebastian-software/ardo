import { globalStyle, style } from "@vanilla-extract/css"

import { fadeInUp } from "../theme/animations.css"
import { vars } from "../theme/contract.css"

export const hero = style({
  padding: "104px 24px 72px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  selectors: {
    // Layered brand-tinted wash, computed from the theme hues. Reads as a
    // designed surface without shouting; adapts to any custom brand color.
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: vars.color.heroWash,
      pointerEvents: "none",
    },
    // A fine dot grid that fades out halfway down. Gives the hero a subtle
    // technical texture instead of a flat fill.
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      backgroundImage: vars.color.heroGrid,
      backgroundSize: "22px 22px",
      maskImage: "linear-gradient(180deg, oklch(0 0 0 / 0.9) 0%, transparent 68%)",
      WebkitMaskImage: "linear-gradient(180deg, oklch(0 0 0 / 0.9) 0%, transparent 68%)",
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
  animation: `${fadeInUp} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
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
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "5px 14px",
  fontSize: "13px",
  fontWeight: 600,
  color: vars.color.brand,
  background: `color-mix(in oklch, ${vars.color.brandSubtle} 72%, ${vars.color.bg})`,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 22%, ${vars.color.border})`,
  borderRadius: vars.radius.full,
  boxShadow: `${vars.color.shadowSm}, ${vars.color.surfaceInset}`,
  marginBottom: "20px",
  letterSpacing: "0.01em",
})

export const heroName = style({
  fontSize: "clamp(40px, 7vw, 60px)",
  fontWeight: 800,
  color: vars.color.text,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
  textWrap: "balance",
})

export const heroText = style({
  fontSize: "clamp(26px, 4.6vw, 40px)",
  fontWeight: 650,
  color: vars.color.textLight,
  marginTop: "10px",
  letterSpacing: "-0.02em",
  lineHeight: 1.16,
  textWrap: "balance",
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
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: `0 0 0 3px ${vars.color.ring}`,
    },
  },
})

export const heroActionBrand = style({
  background: vars.color.brandGradient,
  color: vars.color.brandInk,
  boxShadow: `${vars.color.shadowSm}, 0 8px 20px -6px color-mix(in oklch, ${vars.color.brand} 45%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.18)`,
  selectors: {
    "&:hover": {
      boxShadow: `${vars.color.shadowMd}, 0 12px 28px -6px color-mix(in oklch, ${vars.color.brand} 55%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.18)`,
      filter: "brightness(1.05)",
    },
    "&:focus-visible": {
      boxShadow: `0 0 0 3px ${vars.color.ring}, ${vars.color.shadowMd}`,
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
  background: vars.color.surfaceCard,
  color: vars.color.text,
  border: `1px solid ${vars.color.border}`,
  boxShadow: `${vars.color.shadowSm}, ${vars.color.surfaceInset}`,
  selectors: {
    "&:hover": {
      borderColor: `color-mix(in oklch, ${vars.color.brand} 45%, ${vars.color.border})`,
      color: vars.color.brand,
      boxShadow: `${vars.color.shadowMd}, ${vars.color.surfaceInset}`,
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
