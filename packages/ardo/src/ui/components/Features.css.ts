import { globalStyle, style } from "@vanilla-extract/css"

import { fadeInUp } from "../theme/animations.css"
import { vars } from "../theme/contract.css"

export const features = style({
  padding: "80px 24px",
  background: vars.color.bgSoft,
  borderTop: `1px solid ${vars.color.border}`,
  "@media": {
    "(max-width: 768px)": {
      padding: "48px 16px",
    },
  },
})

export const featuresHeader = style({
  textAlign: "center",
  marginBottom: "48px",
})

export const featuresTitle = style({
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  marginBottom: "12px",
  textWrap: "balance",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "28px",
    },
  },
})

export const featuresSubtitle = style({
  fontSize: "18px",
  color: vars.color.textLight,
  maxWidth: "560px",
  margin: "0 auto",
  textWrap: "pretty",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "16px",
    },
  },
})

export const featuresContainer = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
  maxWidth: "1100px",
  margin: "0 auto",
})

export const feature = style({
  padding: vars.space.lg,
  background: vars.color.bg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowSm,
  transition: `border-color ${vars.transition.base}, box-shadow ${vars.transition.base}, transform ${vars.transition.base}`,
  animation: `${fadeInUp} 0.5s ease both`,
  selectors: {
    "&:hover": {
      borderColor: `color-mix(in oklch, ${vars.color.brand} 22%, ${vars.color.border})`,
      boxShadow: vars.color.shadowMd,
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
      animation: "none",
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
    },
  },
})

// Stagger animation delays
for (let i = 1; i <= 6; i++) {
  globalStyle(`${featuresContainer} ${feature}:nth-child(${i})`, {
    animationDelay: `${(i - 1) * 80}ms`,
  })
}

export const featureIcon = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  marginBottom: "18px",
  background: vars.color.brandSubtle,
  borderRadius: vars.radius.base,
  color: vars.color.brand,
})

export const featureTitle = style({
  fontSize: "17px",
  fontWeight: 600,
  marginBottom: "10px",
  letterSpacing: "-0.01em",
  textWrap: "balance",
})

export const featureDetails = style({
  fontSize: "14px",
  color: vars.color.textLight,
  lineHeight: 1.6,
  marginBottom: "12px",
  textWrap: "pretty",
})

export const featureLink = style({
  fontSize: "14px",
  fontWeight: 500,
  color: vars.color.brand,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  transition: `gap ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      gap: "8px",
    },
    "&::after": {
      content: '"\\2192"',
    },
  },
})
