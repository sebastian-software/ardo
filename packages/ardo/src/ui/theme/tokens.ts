/**
 * Pre-computed OKLCH color values for both light and dark themes.
 * No more `calc(var(...))` chains — all values are resolved here.
 */

const oklch = (l: number, c: number, h: number, alpha?: number) =>
  alpha !== undefined ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`

const BRAND_H = 170

const fontFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const fontMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

export const lightTokens = {
  color: {
    brand: oklch(0.48, 0.15, BRAND_H),
    brandLight: oklch(0.6, 0.15, BRAND_H),
    brandDark: oklch(0.4, 0.17, BRAND_H),
    brandSubtle: oklch(0.96, 0.02, BRAND_H),
    brandGradient: `linear-gradient(135deg, ${oklch(0.48, 0.15, BRAND_H)} 0%, ${oklch(0.56, 0.13, BRAND_H + 30)} 100%)`,
    bg: "#ffffff",
    bgSoft: oklch(0.975, 0.005, BRAND_H),
    bgMute: oklch(0.95, 0.008, BRAND_H),
    bgAlt: oklch(0.925, 0.01, BRAND_H),
    text: oklch(0.22, 0.015, BRAND_H),
    textLight: oklch(0.45, 0.01, BRAND_H),
    textLighter: oklch(0.6, 0.008, BRAND_H),
    border: oklch(0.88, 0.008, BRAND_H),
    borderLight: oklch(0.925, 0.006, BRAND_H),
    divider: oklch(0.88, 0.008, BRAND_H),
    sidebarBg: oklch(0.975, 0.006, BRAND_H),
    sidebarBorder: oklch(0.925, 0.01, BRAND_H),
    codeBg: oklch(0.985, 0.004, BRAND_H),
    codeBorder: oklch(0.92, 0.008, BRAND_H),
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
  },
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

export const darkTokens = {
  color: {
    brand: oklch(0.65, 0.16, BRAND_H),
    brandLight: oklch(0.77, 0.16, BRAND_H),
    brandDark: oklch(0.57, 0.18, BRAND_H),
    brandSubtle: oklch(0.2, 0.04, BRAND_H),
    brandGradient: `linear-gradient(135deg, ${oklch(0.65, 0.16, BRAND_H)} 0%, ${oklch(0.73, 0.14, BRAND_H + 30)} 100%)`,
    bg: oklch(0.15, 0.015, BRAND_H),
    bgSoft: oklch(0.2, 0.02, BRAND_H),
    bgMute: oklch(0.28, 0.02, BRAND_H),
    bgAlt: oklch(0.38, 0.015, BRAND_H),
    text: oklch(0.93, 0.008, BRAND_H),
    textLight: oklch(0.7, 0.015, BRAND_H),
    textLighter: oklch(0.55, 0.012, BRAND_H),
    border: oklch(0.3, 0.02, BRAND_H),
    borderLight: oklch(0.38, 0.015, BRAND_H),
    divider: oklch(0.3, 0.02, BRAND_H),
    sidebarBg: oklch(0.18, 0.018, BRAND_H),
    sidebarBorder: oklch(0.28, 0.02, BRAND_H),
    codeBg: oklch(0.17, 0.01, BRAND_H),
    codeBorder: oklch(0.25, 0.015, BRAND_H),
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
  },
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
