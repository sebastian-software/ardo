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

const shared = {
  layout: {
    sidebarWidth: "280px",
    tocWidth: "240px",
    contentMaxWidth: "1100px",
    headerHeight: "72px",
  },
  transition: {
    fast: "0.15s ease",
    base: "0.2s ease",
    slow: "0.3s ease",
  },
  font: {
    family: fontFamily,
    mono: fontMono,
  },
  radius: {
    sm: "4px",
    base: "8px",
    lg: "12px",
  },
}

function createLightColors(h: number) {
  return {
    brand: oklch(0.48, 0.15, h),
    brandLight: oklch(0.6, 0.15, h),
    brandDark: oklch(0.4, 0.17, h),
    brandSubtle: oklch(0.96, 0.02, h),
    brandGradient: `linear-gradient(135deg, ${oklch(0.48, 0.15, h)} 0%, ${oklch(0.56, 0.13, h + 30)} 100%)`,
    bg: "#ffffff",
    bgSoft: oklch(0.975, 0.005, h),
    bgMute: oklch(0.95, 0.008, h),
    bgAlt: oklch(0.925, 0.01, h),
    text: oklch(0.22, 0.015, h),
    textLight: oklch(0.45, 0.01, h),
    textLighter: oklch(0.6, 0.008, h),
    border: oklch(0.88, 0.008, h),
    borderLight: oklch(0.925, 0.006, h),
    divider: oklch(0.88, 0.008, h),
    sidebarBg: oklch(0.975, 0.006, h),
    sidebarBorder: oklch(0.925, 0.01, h),
    codeBg: oklch(0.985, 0.004, h),
    codeBorder: oklch(0.92, 0.008, h),
    codeShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.04), 0 1px 3px oklch(0 0 0 / 0.06)",
    shadowMd: "0 4px 6px oklch(0 0 0 / 0.04), 0 2px 4px oklch(0 0 0 / 0.03)",
    shadowLg: "0 10px 25px oklch(0 0 0 / 0.06), 0 4px 10px oklch(0 0 0 / 0.04)",
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
  }
}

function createDarkColors(h: number) {
  return {
    brand: oklch(0.65, 0.16, h),
    brandLight: oklch(0.77, 0.16, h),
    brandDark: oklch(0.57, 0.18, h),
    brandSubtle: oklch(0.2, 0.04, h),
    brandGradient: `linear-gradient(135deg, ${oklch(0.65, 0.16, h)} 0%, ${oklch(0.73, 0.14, h + 30)} 100%)`,
    bg: oklch(0.15, 0.015, h),
    bgSoft: oklch(0.2, 0.02, h),
    bgMute: oklch(0.28, 0.02, h),
    bgAlt: oklch(0.38, 0.015, h),
    text: oklch(0.93, 0.008, h),
    textLight: oklch(0.7, 0.015, h),
    textLighter: oklch(0.55, 0.012, h),
    border: oklch(0.3, 0.02, h),
    borderLight: oklch(0.38, 0.015, h),
    divider: oklch(0.3, 0.02, h),
    sidebarBg: oklch(0.18, 0.018, h),
    sidebarBorder: oklch(0.28, 0.02, h),
    codeBg: oklch(0.17, 0.01, h),
    codeBorder: oklch(0.25, 0.015, h),
    codeShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.12), 0 1px 3px oklch(0 0 0 / 0.15)",
    shadowMd: "0 4px 6px oklch(0 0 0 / 0.12), 0 2px 4px oklch(0 0 0 / 0.08)",
    shadowLg: "0 10px 25px oklch(0 0 0 / 0.2), 0 4px 10px oklch(0 0 0 / 0.12)",
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
  }
}

export function createTheme(brandHue: number) {
  return {
    light: { color: createLightColors(brandHue), ...shared },
    dark: { color: createDarkColors(brandHue), ...shared },
  }
}

const defaultTheme = createTheme(170)
export const lightTokens = defaultTheme.light
export const darkTokens = defaultTheme.dark

export function applyBrandTheme(brandHue: number) {
  const theme = createTheme(brandHue)
  createGlobalTheme(":root", vars, theme.light)
  createGlobalTheme(".dark", vars, theme.dark)
}
