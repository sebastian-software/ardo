// The docs use the owl palette from the logo: olive brand, terracotta accent,
// mustard highlights and a barely warm off-white page. The owl colors are much
// calmer than Ardo's default, so the chroma multipliers turn the brand down and
// the accent up; Ardo's recipes derive everything else, light and dark.
import { globalStyle } from "@vanilla-extract/css"
import { applyBrandTheme } from "ardo/theme"

const mustard = 85

applyBrandTheme({
  primary: 123, // olive, the owl's body
  secondary: 38, // terracotta, the owl's wing
  neutral: 95, // a barely warm off-white
  chroma: { brand: 0.4, accent: 2, neutral: 1.6 },
  // Code sits on the off-white instead of a terracotta tint, and warnings take
  // the mustard, so neither reads as the accent.
  light: {
    color: {
      codeBg: `oklch(0.973 0.006 95)`,
      codeBorder: `oklch(0.9 0.009 95)`,
      warning: `oklch(0.5 0.1 72)`,
      warningBg: `oklch(0.972 0.04 90)`,
      warningBorder: `oklch(0.86 0.11 ${mustard})`,
    },
  },
  dark: {
    color: {
      codeBg: `oklch(0.205 0.01 95)`,
      codeBorder: `oklch(0.31 0.014 95)`,
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
