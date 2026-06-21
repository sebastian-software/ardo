/**
 * Pre-computed OKLCH color values for both light and dark themes.
 * No more `calc(var(...))` chains — all values are resolved here.
 */

import { createGlobalTheme } from "@vanilla-extract/css"

import { vars } from "./contract.css"

// eslint-disable-next-line max-params -- mirrors CSS oklch() syntax
const oklch = (l: number, c: number, h: number, alpha?: number) =>
  alpha !== undefined ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`

const fontFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const fontMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

const fontHeading = fontFamily

const shared = {
  layout: {
    sidebarWidth: "20rem",
    tocWidth: "15rem",
    contentMaxWidth: "68ch",
    headerHeight: "3.5rem",
  },
  transition: {
    fast: "0.12s ease-out",
    base: "0.2s ease-out",
    slow: "0.35s ease-out",
  },
  font: {
    family: fontFamily,
    mono: fontMono,
    familyHeading: fontHeading,
    size: "1rem",
    lineHeight: "1.72",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    smd: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "6rem",
    section: "clamp(3rem, 6vw, 5rem)",
    content: "clamp(1.5rem, 3vw, 2.5rem)",
  },
  radius: {
    sm: "0.25rem",
    base: "0.5rem",
    lg: "0.75rem",
  },
}

function createLightColors(primary: number, secondary: number) {
  // Neutrals carry the *primary* hue at very low chroma — the whole page
  // reads as faintly warm, never blue or pink. Code surfaces (further down)
  // explicitly use the secondary hue so they stay visibly cool against this
  // warm base.
  const neutralHue = primary
  return {
    brand: oklch(0.5, 0.1, primary),
    brandLight: oklch(0.62, 0.09, primary),
    brandDark: oklch(0.39, 0.11, primary),
    brandSubtle: oklch(0.955, 0.025, primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.5, 0.1, primary)} 0%, ${oklch(0.6, 0.075, primary + 16)} 100%)`,
    accent: oklch(0.5, 0.075, secondary),
    accentLight: oklch(0.62, 0.07, secondary),
    accentDark: oklch(0.38, 0.085, secondary),
    accentSubtle: oklch(0.963, 0.012, secondary),
    bg: oklch(0.992, 0.0015, neutralHue),
    bgSoft: oklch(0.975, 0.003, neutralHue),
    bgMute: oklch(0.955, 0.004, neutralHue),
    bgAlt: oklch(0.935, 0.005, neutralHue),
    text: oklch(0.17, 0.008, neutralHue),
    textLight: oklch(0.4, 0.007, neutralHue),
    textLighter: oklch(0.56, 0.005, neutralHue),
    border: oklch(0.88, 0.005, neutralHue),
    borderLight: oklch(0.925, 0.003, neutralHue),
    divider: oklch(0.89, 0.004, neutralHue),
    sidebarBg: oklch(0.965, 0.004, neutralHue),
    sidebarBorder: oklch(0.885, 0.005, neutralHue),
    // Code blocks live on the secondary (cool) hue — a visible step away
    // from the warm neutrals so the two surfaces never read as the same.
    codeBg: oklch(0.965, 0.012, secondary),
    codeBorder: oklch(0.88, 0.016, secondary),
    codeShadow: "0 1px 2px oklch(0 0 0 / 0.025)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.035), 0 1px 3px oklch(0 0 0 / 0.045)",
    shadowMd: "0 8px 18px oklch(0 0 0 / 0.045), 0 2px 6px oklch(0 0 0 / 0.035)",
    shadowLg: "0 18px 42px oklch(0 0 0 / 0.075), 0 6px 18px oklch(0 0 0 / 0.045)",
    tip: oklch(0.5, 0.15, 155),
    tipBg: oklch(0.97, 0.025, 155),
    tipBorder: oklch(0.85, 0.08, 155),
    warning: oklch(0.55, 0.16, 45),
    warningBg: oklch(0.98, 0.03, 45),
    warningBorder: oklch(0.88, 0.1, 45),
    danger: oklch(0.5, 0.18, 25),
    dangerBg: oklch(0.97, 0.02, 25),
    dangerBorder: oklch(0.85, 0.1, 25),
    info: oklch(0.5, 0.14, 220),
    infoBg: oklch(0.97, 0.02, 220),
    infoBorder: oklch(0.85, 0.08, 220),
    note: oklch(0.5, 0.14, 270),
    noteBg: oklch(0.97, 0.02, 270),
    noteBorder: oklch(0.88, 0.08, 270),
    badgeBlue: oklch(0.45, 0.12, 250),
    badgeBlueBg: oklch(0.97, 0.02, 250),
    badgeBlueBorder: oklch(0.88, 0.06, 250),
    badgeGreen: oklch(0.42, 0.12, 155),
    badgeGreenBg: oklch(0.97, 0.02, 155),
    badgeGreenBorder: oklch(0.88, 0.06, 155),
    badgeAmber: oklch(0.5, 0.14, 70),
    badgeAmberBg: oklch(0.97, 0.03, 70),
    badgeAmberBorder: oklch(0.88, 0.08, 70),
    badgeRed: oklch(0.5, 0.16, 25),
    badgeRedBg: oklch(0.97, 0.02, 25),
    badgeRedBorder: oklch(0.88, 0.07, 25),
    badgePurple: oklch(0.45, 0.15, 300),
    badgePurpleBg: oklch(0.97, 0.02, 300),
    badgePurpleBorder: oklch(0.88, 0.06, 300),
    badgePink: oklch(0.5, 0.14, 350),
    badgePinkBg: oklch(0.97, 0.02, 350),
    badgePinkBorder: oklch(0.88, 0.06, 350),
  }
}

function createDarkColors(primary: number, secondary: number) {
  // See note in createLightColors — neutrals follow the primary hue.
  const neutralHue = primary
  return {
    brand: oklch(0.74, 0.115, primary),
    brandLight: oklch(0.84, 0.1, primary),
    brandDark: oklch(0.62, 0.125, primary),
    brandSubtle: oklch(0.275, 0.06, primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.74, 0.115, primary)} 0%, ${oklch(0.81, 0.08, primary + 16)} 100%)`,
    accent: oklch(0.74, 0.08, secondary),
    accentLight: oklch(0.84, 0.07, secondary),
    accentDark: oklch(0.6, 0.09, secondary),
    accentSubtle: oklch(0.26, 0.03, secondary),
    bg: oklch(0.155, 0.008, neutralHue),
    bgSoft: oklch(0.195, 0.009, neutralHue),
    bgMute: oklch(0.255, 0.01, neutralHue),
    bgAlt: oklch(0.33, 0.01, neutralHue),
    text: oklch(0.94, 0.004, neutralHue),
    textLight: oklch(0.72, 0.007, neutralHue),
    textLighter: oklch(0.55, 0.007, neutralHue),
    border: oklch(0.285, 0.011, neutralHue),
    borderLight: oklch(0.35, 0.01, neutralHue),
    divider: oklch(0.29, 0.01, neutralHue),
    sidebarBg: oklch(0.13, 0.008, neutralHue),
    sidebarBorder: oklch(0.265, 0.011, neutralHue),
    // Code blocks live on the secondary (cool) hue — same split as light.
    codeBg: oklch(0.21, 0.016, secondary),
    codeBorder: oklch(0.33, 0.024, secondary),
    codeShadow: "0 10px 26px oklch(0 0 0 / 0.18)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.14), 0 1px 3px oklch(0 0 0 / 0.18)",
    shadowMd: "0 8px 18px oklch(0 0 0 / 0.18), 0 2px 6px oklch(0 0 0 / 0.12)",
    shadowLg: "0 20px 50px oklch(0 0 0 / 0.28), 0 8px 20px oklch(0 0 0 / 0.18)",
    tip: oklch(0.5, 0.15, 155),
    tipBg: oklch(0.2, 0.04, 155),
    tipBorder: oklch(0.35, 0.1, 155),
    warning: oklch(0.55, 0.16, 45),
    warningBg: oklch(0.22, 0.05, 45),
    warningBorder: oklch(0.4, 0.12, 45),
    danger: oklch(0.5, 0.18, 25),
    dangerBg: oklch(0.2, 0.04, 25),
    dangerBorder: oklch(0.35, 0.1, 25),
    info: oklch(0.5, 0.14, 220),
    infoBg: oklch(0.2, 0.04, 220),
    infoBorder: oklch(0.35, 0.08, 220),
    note: oklch(0.5, 0.14, 270),
    noteBg: oklch(0.2, 0.04, 270),
    noteBorder: oklch(0.35, 0.08, 270),
    badgeBlue: oklch(0.7, 0.12, 250),
    badgeBlueBg: oklch(0.22, 0.04, 250),
    badgeBlueBorder: oklch(0.35, 0.08, 250),
    badgeGreen: oklch(0.65, 0.12, 155),
    badgeGreenBg: oklch(0.22, 0.04, 155),
    badgeGreenBorder: oklch(0.35, 0.08, 155),
    badgeAmber: oklch(0.7, 0.14, 70),
    badgeAmberBg: oklch(0.22, 0.05, 70),
    badgeAmberBorder: oklch(0.38, 0.1, 70),
    badgeRed: oklch(0.7, 0.14, 25),
    badgeRedBg: oklch(0.22, 0.04, 25),
    badgeRedBorder: oklch(0.35, 0.08, 25),
    badgePurple: oklch(0.7, 0.14, 300),
    badgePurpleBg: oklch(0.22, 0.04, 300),
    badgePurpleBorder: oklch(0.35, 0.08, 300),
    badgePink: oklch(0.7, 0.14, 350),
    badgePinkBg: oklch(0.22, 0.04, 350),
    badgePinkBorder: oklch(0.35, 0.08, 350),
  }
}

/**
 * Default offset between primary and secondary hue. With the default primary
 * 356 this lands at 230 (cool slate-blue) — the documented duo-tone. Any
 * custom primary picks up an approximately complementary secondary.
 */
const DEFAULT_SECONDARY_OFFSET = 234

function defaultSecondary(primary: number): number {
  return (primary + DEFAULT_SECONDARY_OFFSET) % 360
}

export type ArdoBrandHues = {
  primary: number
  secondary?: number
}

export function createTheme(primaryOrHues: ArdoBrandHues | number, secondaryArg?: number) {
  const primary = typeof primaryOrHues === "number" ? primaryOrHues : primaryOrHues.primary
  const explicitSecondary =
    typeof primaryOrHues === "number" ? secondaryArg : primaryOrHues.secondary
  const secondary = explicitSecondary ?? defaultSecondary(primary)
  return {
    light: { color: createLightColors(primary, secondary), ...shared },
    dark: { color: createDarkColors(primary, secondary), ...shared },
  }
}

const defaultTheme = createTheme(356)
export const lightTokens = defaultTheme.light
export const darkTokens = defaultTheme.dark

export function applyBrandTheme(primaryOrHues: ArdoBrandHues | number, secondaryArg?: number) {
  const theme = createTheme(primaryOrHues, secondaryArg)
  createGlobalTheme(":root", vars, theme.light)
  createGlobalTheme(".dark", vars, theme.dark)
}
