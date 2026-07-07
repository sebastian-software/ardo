import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

const brandWash = `color-mix(in oklch, ${vars.color.brand} 14%, transparent)`
const brandWashStrong = `color-mix(in oklch, ${vars.color.brand} 22%, transparent)`
const brandBorder = `color-mix(in oklch, ${vars.color.brand} 38%, ${vars.color.border})`
const brandHalo = `color-mix(in oklch, ${vars.color.brand} 26%, transparent)`
const brandHaloStrong = `color-mix(in oklch, ${vars.color.brand} 36%, transparent)`
const sectionRule = `color-mix(in oklch, ${vars.color.brand} 18%, ${vars.color.border})`
const pageSurface = vars.color.bg
const softSurface = `color-mix(in oklch, ${vars.color.brand} 2%, ${vars.color.bgSoft})`
const inkOnBrand = "oklch(0.985 0.002 356)"

export const homeHero = style({
  position: "relative",
  overflow: "hidden",
  padding: "116px 24px 96px",
  textAlign: "center",
  background: pageSurface,
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: vars.color.heroWash,
      pointerEvents: "none",
    },
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
      padding: "64px 20px 56px",
    },
  },
})

globalStyle(`${homeHero} > div`, {
  maxWidth: "860px",
  position: "relative",
  zIndex: 1,
})

// The hero owl is an inline SVG mark (ArdoOwlMark) drawn in currentColor, so
// it follows the live brand color across themes and custom hues.
export const heroOwl = style({
  width: "clamp(128px, 16vw, 190px)",
  height: "auto",
  marginBottom: "36px",
  color: vars.color.brand,
  filter: `drop-shadow(0 22px 34px color-mix(in oklch, ${vars.color.brand} 26%, transparent))`,
})

globalStyle(`${homeHero} h1`, {
  color: vars.color.brand,
  background: "none",
  WebkitTextFillColor: "currentColor",
  margin: 0,
  // Display ceiling capped at 6rem (96px): loud wordmark, not shouting.
  fontSize: "clamp(58px, 9vw, 96px)",
  fontWeight: "850",
  lineHeight: "1",
  letterSpacing: "-0.035em",
})

// Subtitle sits in a tight lockup under the wordmark and is clearly
// secondary — the size jump (roughly 2.6x) carries the hierarchy.
globalStyle(`${homeHero} p:first-of-type`, {
  maxWidth: "680px",
  margin: "16px auto 0",
  color: vars.color.text,
  fontSize: "clamp(23px, 3.2vw, 37px)",
  fontWeight: "600",
  lineHeight: "1.14",
  letterSpacing: "-0.02em",
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
  background: pageSurface,
  borderTop: `1px solid ${sectionRule}`,
  "@media": {
    "(max-width: 768px)": {
      padding: "48px 16px",
    },
  },
})

export const sectionAlt = style({
  background: pageSurface,
})

export const sectionContainer = style({
  maxWidth: "900px",
  margin: "0 auto",
})

export const quickStartSection = style({
  background: pageSurface,
})

export const homeFeatures = style({
  position: "relative",
  padding: "88px 24px",
  background: softSurface,
  borderTop: `1px solid ${sectionRule}`,
  "@media": {
    "(max-width: 768px)": {
      padding: "56px 16px",
    },
  },
})

globalStyle(`${homeFeatures} > div:first-child`, {
  marginBottom: "52px",
})

globalStyle(`${homeFeatures} > div:first-child h2`, {
  fontSize: "clamp(32px, 5vw, 48px)",
  fontWeight: "800",
  letterSpacing: "0",
})

globalStyle(`${homeFeatures} > div:last-child`, {
  gap: "18px",
})

globalStyle(`${homeFeatures} > div:last-child > div`, {
  borderColor: `color-mix(in oklch, ${vars.color.brand} 18%, ${vars.color.border})`,
  boxShadow: `${vars.color.shadowSm}, inset 0 1px 0 color-mix(in oklch, ${vars.color.bg} 82%, transparent)`,
})

export const mdxSection = style({
  overflow: "hidden",
})

export const stackSection = style({
  background: softSurface,
})

export const comparisonSection = style({
  background: pageSurface,
})

export const sectionTitle = style({
  fontSize: "clamp(34px, 4.8vw, 46px)",
  fontWeight: 800,
  letterSpacing: "0",
  textAlign: "center",
  marginBottom: "12px",
  lineHeight: 1.05,
  textWrap: "balance",
  "@media": {
    "(max-width: 768px)": {
      fontSize: "30px",
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

// Why-story section — the one deliberately asymmetric, personal moment on the
// page. Left column carries the founder quote, right column the reasoning.
export const storySection = style({
  position: "relative",
  padding: "96px 24px",
  background: softSurface,
  borderTop: `1px solid ${sectionRule}`,
  "@media": {
    "(max-width: 768px)": {
      padding: "56px 20px",
    },
  },
})

export const storyGrid = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 5fr) minmax(0, 6fr)",
  gap: "clamp(40px, 6vw, 88px)",
  maxWidth: "980px",
  margin: "0 auto",
  alignItems: "start",
  "@media": {
    "(max-width: 860px)": {
      gridTemplateColumns: "1fr",
      gap: "32px",
    },
  },
})

export const storyQuote = style({
  margin: 0,
  fontSize: "clamp(24px, 3.4vw, 34px)",
  fontWeight: 700,
  lineHeight: 1.28,
  letterSpacing: "-0.02em",
  color: vars.color.text,
  textWrap: "balance",
})

globalStyle(`${storyQuote} em`, {
  fontStyle: "normal",
  color: vars.color.brand,
})

export const storyAttribution = style({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginTop: "28px",
})

export const storyAvatar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "44px",
  height: "44px",
  borderRadius: vars.radius.full,
  background: `linear-gradient(180deg, color-mix(in oklch, ${vars.color.brandSubtle} 55%, ${vars.color.bg}) 0%, ${vars.color.brandSubtle} 100%)`,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 24%, ${vars.color.border})`,
  color: vars.color.brand,
  flexShrink: 0,
})

export const storyName = style({
  fontSize: "15px",
  fontWeight: 650,
  lineHeight: 1.3,
})

export const storyRole = style({
  fontSize: "13px",
  color: vars.color.textLight,
  lineHeight: 1.3,
})

export const storyBody = style({
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  paddingTop: "6px",
})

globalStyle(`${storyBody} p`, {
  margin: 0,
  fontSize: "16.5px",
  lineHeight: 1.72,
  color: vars.color.textLight,
  textWrap: "pretty",
})

globalStyle(`${storyBody} p strong`, {
  color: vars.color.text,
  fontWeight: 650,
})

// Terminal mock
export const terminal = style({
  borderRadius: vars.radius.lg,
  overflow: "hidden",
  border: `1px solid ${brandBorder}`,
  boxShadow: `${vars.color.shadowLg}, 0 24px 80px ${brandWash}`,
  maxWidth: "600px",
  margin: "0 auto",
  transition: `transform ${vars.transition.slow}, box-shadow ${vars.transition.slow}, border-color ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: `color-mix(in oklch, ${vars.color.brand} 46%, ${vars.color.border})`,
      boxShadow: `${vars.color.shadowLg}, 0 28px 90px ${brandWashStrong}`,
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
      background: vars.color.brand,
    },
    "&:nth-child(2)": {
      background: vars.color.textLighter,
    },
    "&:nth-child(3)": {
      background: sectionRule,
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

// The UA stylesheet forces `font-family: monospace` (Courier) on <code>;
// re-apply the theme's mono stack.
globalStyle(`${terminalBody} code`, {
  fontFamily: vars.font.mono,
})

export const terminalPrompt = style({
  color: vars.color.brand,
  fontWeight: 600,
  marginRight: "8px",
})

export const terminalSuccess = style({
  color: vars.color.brand,
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
  background: pageSurface,
  borderRadius: vars.radius.lg,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 16%, ${vars.color.border})`,
  fontSize: "14px",
  fontWeight: 650,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: brandBorder,
      boxShadow: `${vars.color.shadowSm}, 0 14px 36px ${brandWash}`,
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

// Comparison — an editorial, curated list rather than a wide spec matrix.
// Each row names a tool and one honest sentence; Ardo's row is highlighted.
export const compareList = style({
  listStyle: "none",
  margin: "0 auto",
  padding: 0,
  maxWidth: "760px",
  display: "flex",
  flexDirection: "column",
})

export const compareRow = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 190px) minmax(0, 1fr)",
  gap: "clamp(16px, 3vw, 40px)",
  alignItems: "baseline",
  padding: "20px 4px",
  borderBottom: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:first-child": {
      borderTop: `1px solid ${vars.color.divider}`,
    },
  },
  "@media": {
    "(max-width: 620px)": {
      gridTemplateColumns: "1fr",
      gap: "6px",
      padding: "16px 4px",
    },
  },
})

export const compareRowSelf = style({
  padding: "22px 20px",
  margin: "0 -20px",
  borderRadius: vars.radius.lg,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 30%, ${vars.color.border})`,
  background: `color-mix(in oklch, ${vars.color.brandSubtle} 70%, ${vars.color.bg})`,
  boxShadow: `${vars.color.shadowSm}, ${vars.color.surfaceInset}`,
  selectors: {
    "&:first-child": {
      borderTop: `1px solid color-mix(in oklch, ${vars.color.brand} 30%, ${vars.color.border})`,
    },
  },
  "@media": {
    "(max-width: 620px)": {
      padding: "18px 16px",
      margin: "0",
    },
  },
})

export const compareName = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
  fontSize: "17px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: vars.color.text,
})

globalStyle(`${compareRowSelf} ${compareName}`, {
  color: vars.color.brand,
})

export const compareTag = style({
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 9px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: vars.color.textLight,
  background: vars.color.bgMute,
  border: `1px solid ${vars.color.borderLight}`,
  borderRadius: vars.radius.full,
})

globalStyle(`${compareRowSelf} ${compareTag}`, {
  color: vars.color.brand,
  background: `color-mix(in oklch, ${vars.color.brand} 12%, transparent)`,
  border: `1px solid color-mix(in oklch, ${vars.color.brand} 28%, ${vars.color.border})`,
})

export const compareNote = style({
  margin: 0,
  fontSize: "15px",
  lineHeight: 1.6,
  color: vars.color.textLight,
  textWrap: "pretty",
})

globalStyle(`${compareRowSelf} ${compareNote}`, {
  color: vars.color.text,
})

export const comparisonCta = style({
  textAlign: "center",
  marginTop: "36px",
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

// Examples section
export const examplesSection = style({
  background: pageSurface,
})

export const examplesGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
})

export const exampleCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.smd,
  padding: vars.space.lg,
  background: softSurface,
  border: `1px solid ${vars.color.borderLight}`,
  borderRadius: vars.radius.lg,
  textDecoration: "none",
  color: vars.color.text,
  transition: `border-color ${vars.transition.base}, transform ${vars.transition.base}, box-shadow ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: brandBorder,
      boxShadow: `${vars.color.shadowSm}, 0 14px 36px ${brandWash}`,
      transform: "translateY(-2px)",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
})

export const exampleTitle = style({
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.01em",
})

export const exampleDescription = style({
  fontSize: "14px",
  lineHeight: 1.55,
  color: vars.color.textLight,
  margin: 0,
})

export const exampleLink = style({
  marginTop: "auto",
  fontSize: "14px",
  fontWeight: 600,
  color: vars.color.brand,
})

// CTA section
export const ctaSection = style({
  textAlign: "center",
  overflow: "hidden",
  background: softSurface,
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
