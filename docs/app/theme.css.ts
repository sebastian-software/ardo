// The docs try the owl palette from the new logo: olive brand, terracotta
// accent, mustard highlights and paper backgrounds. Ardo's default theme stays
// as it is. The owl colors are much less saturated than the default chroma
// curve, so the colors are set directly instead of derived from the hues.
import { globalStyle } from "@vanilla-extract/css"
import { applyBrandTheme } from "ardo/theme"

const olive = 123
const terracotta = 38
const paper = 86
const mustard = 85

applyBrandTheme({
  primary: olive,
  secondary: terracotta,
  neutral: paper,
  light: {
    color: {
      // #617042, the owl's body
      brand: `oklch(0.52 0.07 ${olive})`,
      brandLight: `oklch(0.62 0.075 ${olive})`,
      brandDark: `oklch(0.45 0.06 ${olive})`,
      brandSubtle: `oklch(0.94 0.04 115)`,
      brandGradient: `linear-gradient(135deg, oklch(0.52 0.07 ${olive}) 0%, oklch(0.54 0.075 112) 100%)`,
      brandInk: `oklch(0.97 0.025 ${paper})`,
      ring: `oklch(0.52 0.07 ${olive} / 0.4)`,
      // Darker than the owl's wing (#e85221) so it holds up as link text.
      accent: `oklch(0.5 0.15 ${terracotta})`,
      accentLight: `oklch(0.64 0.19 ${terracotta})`,
      accentDark: `oklch(0.42 0.13 ${terracotta})`,
      accentSubtle: `oklch(0.955 0.025 50)`,
      bg: `oklch(0.985 0.012 ${paper})`,
      bgSoft: `oklch(0.97 0.02 ${paper})`,
      bgMute: `oklch(0.95 0.026 ${paper})`,
      bgAlt: `oklch(0.925 0.03 ${paper})`,
      // #181817, the owl's pupils
      text: `oklch(0.21 0.008 100)`,
      textLight: `oklch(0.41 0.02 90)`,
      textLighter: `oklch(0.48 0.02 90)`,
      border: `oklch(0.87 0.03 ${paper})`,
      borderLight: `oklch(0.915 0.024 ${paper})`,
      divider: `oklch(0.885 0.026 ${paper})`,
      // #fcf2dc, the owl's face
      sidebarBg: `oklch(0.963 0.031 ${paper})`,
      sidebarRailBg: `oklch(0.935 0.036 ${paper})`,
      sidebarBorder: `oklch(0.87 0.032 ${paper})`,
      codeBg: `oklch(0.965 0.022 ${paper})`,
      codeBorder: `oklch(0.875 0.03 ${paper})`,
      headerBg: `oklch(0.985 0.012 ${paper} / 0.82)`,
      surfaceCard: `linear-gradient(180deg, oklch(0.99 0.01 ${paper}) 0%, oklch(0.975 0.016 ${paper}) 100%)`,
      heroWash: `radial-gradient(90rem 42rem at 50% -12rem, oklch(0.92 0.05 115 / 0.55) 0%, transparent 62%), radial-gradient(64rem 36rem at 84% -8rem, oklch(0.93 0.08 ${mustard} / 0.5) 0%, transparent 58%), linear-gradient(180deg, oklch(0.975 0.016 ${paper}) 0%, oklch(0.985 0.012 ${paper}) 100%)`,
      heroGrid: `radial-gradient(circle at 1px 1px, oklch(0.52 0.07 ${olive} / 0.2) 1px, transparent 1.5px)`,
      // Warnings take the mustard, so they don't read as the terracotta accent.
      warning: `oklch(0.5 0.1 72)`,
      warningBg: `oklch(0.972 0.04 90)`,
      warningBorder: `oklch(0.86 0.11 ${mustard})`,
    },
  },
  dark: {
    color: {
      brand: `oklch(0.76 0.09 120)`,
      brandLight: `oklch(0.84 0.08 118)`,
      brandDark: `oklch(0.66 0.085 ${olive})`,
      brandSubtle: `oklch(0.28 0.04 120)`,
      brandGradient: `linear-gradient(135deg, oklch(0.74 0.09 120) 0%, oklch(0.8 0.1 100) 100%)`,
      brandInk: `oklch(0.2 0.03 120)`,
      ring: `oklch(0.76 0.09 120 / 0.5)`,
      accent: `oklch(0.74 0.13 45)`,
      accentLight: `oklch(0.82 0.1 50)`,
      accentDark: `oklch(0.64 0.15 40)`,
      accentSubtle: `oklch(0.27 0.045 40)`,
      bg: `oklch(0.165 0.006 95)`,
      bgSoft: `oklch(0.2 0.008 95)`,
      bgMute: `oklch(0.255 0.01 95)`,
      bgAlt: `oklch(0.33 0.012 95)`,
      text: `oklch(0.94 0.018 ${paper})`,
      textLight: `oklch(0.76 0.02 ${paper})`,
      textLighter: `oklch(0.7 0.02 ${paper})`,
      border: `oklch(0.29 0.012 95)`,
      borderLight: `oklch(0.35 0.012 95)`,
      divider: `oklch(0.295 0.012 95)`,
      sidebarBg: `oklch(0.14 0.006 95)`,
      sidebarRailBg: `oklch(0.115 0.006 95)`,
      sidebarBorder: `oklch(0.27 0.01 95)`,
      codeBg: `oklch(0.205 0.01 95)`,
      codeBorder: `oklch(0.31 0.014 95)`,
      headerBg: `oklch(0.165 0.006 95 / 0.8)`,
      surfaceCard: `linear-gradient(180deg, oklch(0.215 0.009 95) 0%, oklch(0.19 0.008 95) 100%)`,
      heroWash: `radial-gradient(90rem 42rem at 50% -12rem, oklch(0.34 0.06 120 / 0.55) 0%, transparent 62%), radial-gradient(64rem 36rem at 84% -8rem, oklch(0.33 0.06 ${mustard} / 0.4) 0%, transparent 58%), linear-gradient(180deg, oklch(0.18 0.008 95) 0%, oklch(0.165 0.006 95) 100%)`,
      heroGrid: `radial-gradient(circle at 1px 1px, oklch(0.8 0.08 115 / 0.16) 1px, transparent 1.5px)`,
      warning: `oklch(0.8 0.13 ${mustard})`,
      warningBg: `oklch(0.23 0.04 80)`,
      warningBorder: `oklch(0.42 0.09 80)`,
    },
  },
})

// Selected text gets a mustard highlighter.
globalStyle("::selection", {
  background: `oklch(0.88 0.13 ${mustard} / 0.55)`,
})

globalStyle(".dark ::selection", {
  background: `oklch(0.5 0.1 ${mustard} / 0.55)`,
})
