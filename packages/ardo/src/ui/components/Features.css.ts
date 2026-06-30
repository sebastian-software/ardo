import { globalStyle, style } from "@vanilla-extract/css"

import { fadeInUp } from "../theme/animations.css"
import { vars } from "../theme/contract.css"

const brandBorder = `color-mix(in oklch, ${vars.color.brand} 38%, ${vars.color.border})`
const brandRing = `color-mix(in oklch, ${vars.color.brand} 12%, transparent)`
const brandPanel = `color-mix(in oklch, ${vars.color.brand} 5%, ${vars.color.bg})`
const brandRail = `color-mix(in oklch, ${vars.color.brand} 42%, ${vars.color.border})`

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
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "18px",
  maxWidth: "1100px",
  margin: "0 auto",
  "@media": {
    "(max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "(max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
})

export const feature = style({
  position: "relative",
  gridColumn: "span 2",
  minHeight: "100%",
  padding: vars.space.lg,
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, ${brandPanel} 100%)`,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowSm,
  transition: `all ${vars.transition.base}`,
  animation: `${fadeInUp} 0.5s ease both`,
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "18px auto 18px 0",
      width: "3px",
      borderRadius: "999px",
      background: brandRail,
      opacity: 0.7,
    },
    "&:hover": {
      borderColor: brandBorder,
      boxShadow: `${vars.color.shadowMd}, 0 0 0 1px ${brandRing}`,
    },
  },
  "@media": {
    "(max-width: 900px)": {
      gridColumn: "span 1",
    },
    "(hover: hover)": {
      selectors: {
        "&:hover": {
          transform: "translateY(-3px)",
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

globalStyle(
  `${featuresContainer} ${feature}:nth-child(1), ${featuresContainer} ${feature}:nth-child(2)`,
  {
    gridColumn: "span 3",
  }
)

globalStyle(`${featuresContainer} ${feature}:nth-child(5n + 4)`, {
  background: vars.color.bg,
})

globalStyle(`${featuresContainer} ${feature}:nth-child(5n)`, {
  background: `linear-gradient(180deg, ${brandPanel} 0%, ${vars.color.bg} 100%)`,
})

globalStyle(
  `${featuresContainer} ${feature}:nth-child(1), ${featuresContainer} ${feature}:nth-child(2)`,
  {
    "@media": {
      "(max-width: 900px)": {
        gridColumn: "span 1",
      },
    },
  }
)

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
  width: "48px",
  height: "48px",
  marginBottom: "16px",
  background: vars.color.brandSubtle,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 16%, ${vars.color.border})`,
  borderRadius: vars.radius.base,
  color: vars.color.brand,
  transition: `all ${vars.transition.base}`,
})

globalStyle(`${feature}:hover ${featureIcon}`, {
  background: vars.color.brand,
  color: "white",
  borderColor: "transparent",
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
