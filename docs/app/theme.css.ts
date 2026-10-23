// Selected text gets the mustard highlighter of the owl palette; the palette
// itself is the `theme` in root.tsx.
import { globalStyle } from "@vanilla-extract/css"

const mustard = 85

globalStyle("::selection", {
  background: `oklch(0.88 0.13 ${mustard} / 0.55)`,
})

globalStyle(".dark ::selection", {
  background: `oklch(0.5 0.1 ${mustard} / 0.55)`,
})
