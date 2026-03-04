import { style } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const homeCtaSection = style({
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, ${vars.color.brandSubtle} 100%)`,
  selectors: {
    ".dark &": {
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, oklch(0.18 0.04 170) 100%)`,
    },
  },
})

export const homeCtaButtons = style({
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  flexWrap: "wrap",
})

export const homeCtaPrimary = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "16px 32px",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.base}`,
  background: vars.color.brand,
  color: "white",
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
      boxShadow: "0 8px 24px oklch(0.48 0.15 170 / 0.3)",
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
    "(max-width: 768px)": {
      width: "100%",
      justifyContent: "center",
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

export const homeCtaSecondary = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  padding: "16px 32px",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.base}`,
  background: vars.color.bg,
  color: vars.color.text,
  border: `1px solid ${vars.color.border}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
      color: vars.color.brand,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      width: "100%",
      justifyContent: "center",
    },
  },
})
