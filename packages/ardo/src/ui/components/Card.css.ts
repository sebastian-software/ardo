import { style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

const brandBorder = `color-mix(in oklch, ${vars.color.brand} 34%, ${vars.color.border})`
const brandRing = `color-mix(in oklch, ${vars.color.brand} 14%, transparent)`

export const cardGroup = style({
  display: "grid",
  gridTemplateColumns: "repeat(var(--ardo-card-cols, 2), minmax(0, 1fr))",
  gap: "16px",
  margin: "24px 0",
  selectors: {
    '&[data-cols="1"]': {
      vars: {
        "--ardo-card-cols": "1",
      },
    },
    '&[data-cols="2"]': {
      vars: {
        "--ardo-card-cols": "2",
      },
    },
    '&[data-cols="3"]': {
      vars: {
        "--ardo-card-cols": "3",
      },
    },
    '&[data-cols="4"]': {
      vars: {
        "--ardo-card-cols": "4",
      },
    },
  },
  "@media": {
    "(max-width: 900px)": {
      gridTemplateColumns: "repeat(min(var(--ardo-card-cols, 2), 2), minmax(0, 1fr))",
    },
    "(max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
})

export const card = style({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
  padding: "18px",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  background: vars.color.bg,
  boxShadow: vars.color.shadowSm,
  color: vars.color.text,
  textDecoration: "none",
  transition: `border-color ${vars.transition.base}, box-shadow ${vars.transition.base}, transform ${vars.transition.base}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
})

export const cardLink = style([
  card,
  {
    selectors: {
      "&:hover": {
        borderColor: brandBorder,
        boxShadow: `${vars.color.shadowMd}, 0 0 0 1px ${brandRing}`,
        textDecoration: "none",
      },
      "&:focus-visible": {
        outline: `2px solid ${vars.color.brand}`,
        outlineOffset: "2px",
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
        transition: "none",
        selectors: {
          "&:hover": {
            transform: "none",
          },
        },
      },
    },
  },
])

export const cardHeader = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
})

export const cardIcon = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.base,
  background: vars.color.brandSubtle,
  color: vars.color.brand,
})

export const cardTitle = style({
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  lineHeight: 1.35,
})

export const cardBody = style({
  display: "block",
  marginTop: "10px",
  color: vars.color.textLight,
  fontSize: "14px",
  lineHeight: 1.6,
})
