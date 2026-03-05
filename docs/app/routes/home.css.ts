import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

export const section = style({
  padding: "80px 24px",
  "@media": {
    "(max-width: 768px)": {
      padding: "48px 16px",
    },
  },
})

export const sectionAlt = style({
  background: vars.color.bgSoft,
  borderTop: `1px solid ${vars.color.border}`,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const sectionContainer = style({
  maxWidth: "900px",
  margin: "0 auto",
})

export const sectionTitle = style({
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  textAlign: "center",
  marginBottom: "12px",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "28px",
    },
  },
})

export const sectionSubtitle = style({
  fontSize: "18px",
  color: vars.color.textLight,
  textAlign: "center",
  maxWidth: "560px",
  margin: "0 auto 40px",
  lineHeight: 1.6,
  "@media": {
    "(max-width: 768px)": {
      fontSize: "16px",
    },
  },
})

// Terminal mock
export const terminal = style({
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowLg,
  maxWidth: "600px",
  margin: "0 auto",
})

export const terminalHeader = style({
  display: "flex",
  gap: "8px",
  padding: "12px 16px",
  background: vars.color.bgMute,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const terminalDot = style({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: vars.color.border,
})

export const terminalBody = style({
  padding: "20px 24px",
  background: vars.color.codeBg,
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.8,
})

export const terminalPrompt = style({
  color: vars.color.brand,
  fontWeight: 600,
  marginRight: "8px",
})

export const terminalSuccess = style({
  color: "oklch(0.6 0.18 145)",
  fontWeight: 600,
})

export const terminalLink = style({
  color: vars.color.brand,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
})

// Code example
export const codeExample = style({
  maxWidth: "700px",
  margin: "0 auto",
})

// Tech grid
export const techGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "16px",
  maxWidth: "800px",
  margin: "0 auto",
})

export const techItem = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  padding: "16px",
  background: vars.color.bg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  fontSize: "14px",
  fontWeight: 500,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: "oklch(0.48 0.15 170 / 0.4)",
      boxShadow: vars.color.shadowSm,
    },
  },
})

export const techIcon = style({
  color: vars.color.brand,
})

// Comparison table
export const comparison = style({
  overflowX: "auto",
  margin: "0 auto",
  maxWidth: "800px",
})

export const comparisonTable = style({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  textAlign: "left",
})

globalStyle(`${comparisonTable} th, ${comparisonTable} td`, {
  padding: "12px 16px",
  borderBottom: `1px solid ${vars.color.border}`,
})

globalStyle(`${comparisonTable} th`, {
  fontWeight: 600,
  fontSize: "13px",
  color: vars.color.textLight,
  background: vars.color.bgSoft,
})

export const comparisonHighlight = style({
  background: "oklch(0.48 0.15 170 / 0.04)",
  fontWeight: 500,
})

globalStyle(`.dark ${comparisonHighlight}`, {
  background: "oklch(0.65 0.16 170 / 0.08)",
})

export const check = style({
  color: "oklch(0.6 0.18 145)",
  fontWeight: 600,
})

export const x = style({
  color: vars.color.textLighter,
})

export const comparisonCta = style({
  textAlign: "center",
  marginTop: "32px",
})

export const link = style({
  color: vars.color.brand,
  fontWeight: 500,
  textDecoration: "none",
  fontSize: "15px",
  selectors: {
    "&:hover": {
      textDecoration: "underline",
    },
  },
})

// CTA section
export const ctaSection = style({
  textAlign: "center",
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, ${vars.color.bgSoft} 100%)`,
})

export const ctaButtons = style({
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  flexWrap: "wrap",
})

export const ctaPrimary = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 28px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  background: vars.color.brand,
  color: "white",
  boxShadow: "0 4px 14px oklch(0.48 0.15 170 / 0.3)",
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      background: vars.color.brandDark,
      boxShadow: "0 6px 20px oklch(0.48 0.15 170 / 0.4)",
    },
  },
})

export const ctaSecondary = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 28px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  background: vars.color.bg,
  color: vars.color.text,
  border: `1px solid ${vars.color.border}`,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
      color: vars.color.brand,
    },
  },
})
