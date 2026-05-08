import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

const berryWash = `color-mix(in oklch, ${vars.color.brand} 16%, transparent)`
const berryWashStrong = `color-mix(in oklch, ${vars.color.brand} 26%, transparent)`
const brandBorder = `color-mix(in oklch, ${vars.color.brand} 34%, ${vars.color.border})`
const brandHalo = `color-mix(in oklch, ${vars.color.brand} 26%, transparent)`
const brandHaloStrong = `color-mix(in oklch, ${vars.color.brand} 36%, transparent)`
const inkOnBrand = "oklch(0.985 0.002 356)"

export const homeHero = style({
  position: "relative",
  overflow: "hidden",
  padding: "112px 24px 88px",
  textAlign: "center",
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 4%, ${vars.color.bgSoft}) 62%, ${vars.color.bg} 100%)`,
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      inset: "auto 0 0",
      height: "1px",
      background: `linear-gradient(90deg, transparent, color-mix(in oklch, ${vars.color.brand} 32%, ${vars.color.border}), transparent)`,
      pointerEvents: "none",
    },
    ".dark &": {
      background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 10%, ${vars.color.bgSoft}) 62%, ${vars.color.bg} 100%)`,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      padding: "64px 20px 56px",
    },
  },
})

globalStyle(`${homeHero} > div`, {
  maxWidth: "860px",
})

globalStyle(`${homeHero} img`, {
  width: "clamp(116px, 15vw, 176px)",
  marginBottom: "36px",
  filter: `drop-shadow(0 18px 28px color-mix(in oklch, ${vars.color.brand} 18%, transparent))`,
})

globalStyle(`${homeHero} h1`, {
  color: vars.color.brand,
  background: "none",
  WebkitTextFillColor: "currentColor",
})

globalStyle(`${homeHero} p:first-of-type`, {
  maxWidth: "780px",
  marginLeft: "auto",
  marginRight: "auto",
})

globalStyle(`${homeHero} a:first-child`, {
  background: `linear-gradient(135deg, ${vars.color.brand} 0%, color-mix(in oklch, ${vars.color.brand} 80%, oklch(0.58 0.09 24)) 100%)`,
})

globalStyle(`${homeHero} a:first-child:hover`, {
  background: `linear-gradient(135deg, ${vars.color.brandDark} 0%, color-mix(in oklch, ${vars.color.brand} 74%, oklch(0.55 0.1 24)) 100%)`,
})

export const section = style({
  position: "relative",
  padding: "80px 24px",
  "@media": {
    "(max-width: 768px)": {
      padding: "48px 16px",
    },
  },
})

export const sectionAlt = style({
  background: `linear-gradient(180deg, ${vars.color.bgSoft}, color-mix(in oklch, ${vars.color.brand} 3%, ${vars.color.bgSoft}))`,
  borderTop: `1px solid ${vars.color.border}`,
  borderBottom: `1px solid ${vars.color.border}`,
})

export const sectionContainer = style({
  maxWidth: "900px",
  margin: "0 auto",
})

export const quickStartSection = style({
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 3%, ${vars.color.bg}) 100%)`,
})

export const mdxSection = style({
  overflow: "hidden",
})

export const stackSection = style({
  background: `linear-gradient(135deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 5%, ${vars.color.bgSoft}) 48%, ${vars.color.bg} 100%)`,
})

export const comparisonSection = style({
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 3%, ${vars.color.bg}) 100%)`,
})

export const sectionTitle = style({
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "0",
  textAlign: "center",
  marginBottom: "12px",
  textWrap: "balance",
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
  textWrap: "pretty",
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
  border: `1px solid ${brandBorder}`,
  boxShadow: `${vars.color.shadowLg}, 0 24px 80px ${berryWash}`,
  maxWidth: "600px",
  margin: "0 auto",
  transition: `transform ${vars.transition.slow}, box-shadow ${vars.transition.slow}, border-color ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: `color-mix(in oklch, ${vars.color.brand} 46%, ${vars.color.border})`,
      boxShadow: `${vars.color.shadowLg}, 0 28px 90px ${berryWashStrong}`,
      transform: "translateY(-3px)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
    },
  },
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
  selectors: {
    "&:nth-child(1)": {
      background: "oklch(0.72 0.12 28)",
    },
    "&:nth-child(2)": {
      background: "oklch(0.76 0.11 72)",
    },
    "&:nth-child(3)": {
      background: "oklch(0.66 0.09 168)",
    },
  },
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
  color: "oklch(0.55 0.11 168)",
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
      borderColor: brandBorder,
      boxShadow: `${vars.color.shadowSm}, 0 14px 36px ${berryWash}`,
      transform: "translateY(-2px)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
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
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.color.shadowSm,
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
  background: `linear-gradient(180deg, ${vars.color.bgSoft}, color-mix(in oklch, ${vars.color.brand} 4%, ${vars.color.bgSoft}))`,
})

export const comparisonHighlight = style({
  background: `color-mix(in oklch, ${vars.color.brandSubtle} 72%, ${vars.color.bg})`,
  fontWeight: 500,
})

globalStyle(`.dark ${comparisonHighlight}`, {
  background: `color-mix(in oklch, ${vars.color.brand} 14%, transparent)`,
})

export const check = style({
  color: vars.color.brand,
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
  overflow: "hidden",
  background: `linear-gradient(180deg, ${vars.color.bg} 0%, color-mix(in oklch, ${vars.color.brand} 6%, ${vars.color.bgSoft}) 100%)`,
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
  background: `linear-gradient(135deg, ${vars.color.brand} 0%, color-mix(in oklch, ${vars.color.brand} 80%, oklch(0.58 0.09 24)) 100%)`,
  color: inkOnBrand,
  boxShadow: `0 4px 14px ${brandHalo}`,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      background: `linear-gradient(135deg, ${vars.color.brandDark} 0%, color-mix(in oklch, ${vars.color.brand} 74%, oklch(0.55 0.1 24)) 100%)`,
      boxShadow: `0 6px 20px ${brandHaloStrong}`,
      transform: "translateY(-2px)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
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
      transform: "translateY(-2px)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
    },
  },
})
