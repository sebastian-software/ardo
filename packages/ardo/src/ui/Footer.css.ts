import { style } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const footer = style({
  padding: "32px 24px",
  textAlign: "center",
  boxShadow: "0 -1px 3px oklch(0 0 0 / 0.03)",
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, oklch(0.97 0.01 170) 100%)`,
  selectors: {
    ".dark &": {
      boxShadow: "0 -1px 3px oklch(0 0 0 / 0.1)",
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, oklch(0.18 0.015 170) 100%)`,
    },
  },
})

export const footerContainer = style({})

export const footerPrimary = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 0,
  flexWrap: "wrap",
  fontSize: "14px",
  color: vars.color.textLight,
  marginBottom: "6px",
})

export const footerSeparator = style({
  display: "inline-block",
  width: "4px",
  height: "4px",
  borderRadius: "50%",
  background: vars.color.textLighter,
  margin: "0 12px",
  verticalAlign: "middle",
})

export const footerLink = style({
  color: vars.color.brand,
  textDecoration: "none",
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const footerMessage = style({
  fontSize: "14px",
  color: vars.color.textLighter,
})

export const footerCopyright = style({
  fontSize: "14px",
  color: vars.color.textLighter,
})

export const footerBuildTime = style({
  fontSize: "12px",
  color: vars.color.textLighter,
  marginTop: "6px",
})

export const contentFooter = style({
  marginTop: "60px",
  paddingTop: "24px",
  borderTop: `1px solid ${vars.color.border}`,
})

export const contentMeta = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  fontSize: "14px",
  color: vars.color.textLighter,
})

export const editLink = style({
  color: vars.color.brand,
  textDecoration: "none",
  fontWeight: 500,
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const prevNext = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
})

const prevNextLinkBase = style({
  display: "flex",
  flexDirection: "column",
  padding: "16px 20px",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  textDecoration: "none",
  boxShadow: vars.color.shadowSm,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: "oklch(0.48 0.15 170 / 0.4)",
      background: vars.color.brandSubtle,
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
  },
})

export const prevLink = style([prevNextLinkBase])

export const nextLink = style([prevNextLinkBase, { textAlign: "right" }])

export const prevNextLabel = style({
  fontSize: "12px",
  fontWeight: 500,
  color: vars.color.textLighter,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "4px",
})

export const prevNextTitle = style({
  fontWeight: 600,
  color: vars.color.brand,
})
