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

function createLightColors(h: number) {
  const neutralHue = h
  return {
    brand: oklch(0.505, 0.085, h),
    brandLight: oklch(0.63, 0.075, h),
    brandDark: oklch(0.39, 0.095, h),
    brandSubtle: oklch(0.965, 0.012, h),
    brandGradient: `linear-gradient(135deg, ${oklch(0.505, 0.085, h)} 0%, ${oklch(0.61, 0.058, h + 16)} 100%)`,
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
    codeBg: oklch(0.955, 0.004, neutralHue),
    codeBorder: oklch(0.88, 0.005, neutralHue),
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
    badgePurple: oklch(0.45, 0.15, 300),
    badgePurpleBg: oklch(0.97, 0.02, 300),
    badgePurpleBorder: oklch(0.88, 0.06, 300),
    badgePink: oklch(0.5, 0.14, 350),
    badgePinkBg: oklch(0.97, 0.02, 350),
    badgePinkBorder: oklch(0.88, 0.06, 350),
  }
}

function createDarkColors(h: number) {
  const neutralHue = h
  return {
    brand: oklch(0.72, 0.095, h),
    brandLight: oklch(0.82, 0.085, h),
    brandDark: oklch(0.61, 0.105, h),
    brandSubtle: oklch(0.255, 0.03, h),
    brandGradient: `linear-gradient(135deg, ${oklch(0.72, 0.095, h)} 0%, ${oklch(0.79, 0.068, h + 16)} 100%)`,
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
    codeBg: oklch(0.19, 0.008, neutralHue),
    codeBorder: oklch(0.31, 0.01, neutralHue),
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
    badgePurple: oklch(0.7, 0.14, 300),
    badgePurpleBg: oklch(0.22, 0.04, 300),
    badgePurpleBorder: oklch(0.35, 0.08, 300),
    badgePink: oklch(0.7, 0.14, 350),
    badgePinkBg: oklch(0.22, 0.04, 350),
    badgePinkBorder: oklch(0.35, 0.08, 350),
  }
}

export function createTheme(brandHue: number) {
  return {
    light: { color: createLightColors(brandHue), ...shared },
    dark: { color: createDarkColors(brandHue), ...shared },
  }
}

const defaultTheme = createTheme(356)
export const lightTokens = defaultTheme.light
export const darkTokens = defaultTheme.dark

export function applyBrandTheme(brandHue: number) {
  const theme = createTheme(brandHue)
  createGlobalTheme(":root", vars, theme.light)
  createGlobalTheme(".dark", vars, theme.dark)
}
