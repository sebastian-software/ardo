import { globalStyle } from "@vanilla-extract/css"

import { vars } from "./contract.css"

globalStyle("*", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
})

globalStyle("html", {
  scrollPaddingTop: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top) + 24px)`,
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      scrollBehavior: "smooth",
    },
  },
})

globalStyle("body", {
  fontFamily: vars.font.family,
  fontSize: "16px",
  lineHeight: 1.7,
  color: vars.color.text,
  background: vars.color.bg,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
})

globalStyle("::selection", {
  background: `oklch(0.48 0.15 170 / 0.2)`,
})

globalStyle(".dark ::selection", {
  background: `oklch(0.65 0.16 170 / 0.2)`,
})

globalStyle(":focus-visible", {
  outline: `2px solid ${vars.color.brand}`,
  outlineOffset: "2px",
})

globalStyle("button:focus-visible, a:focus-visible", {
  outline: `2px solid ${vars.color.brand}`,
  outlineOffset: "2px",
})
