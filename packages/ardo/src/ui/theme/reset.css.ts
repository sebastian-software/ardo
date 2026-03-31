import { globalStyle } from "@vanilla-extract/css"

import { vars } from "./contract.css"

globalStyle("*", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
})

globalStyle("html", {
  scrollPaddingTop: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top) + 32px)`,
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      scrollBehavior: "smooth",
    },
  },
})

globalStyle("body", {
  fontFamily: vars.font.family,
  fontSize: vars.font.size,
  lineHeight: vars.font.lineHeight,
  color: vars.color.text,
  background: vars.color.bg,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  textRendering: "optimizeLegibility",
})

globalStyle("::selection", {
  background: vars.color.brandSubtle,
})

globalStyle(":focus-visible", {
  outline: `2px solid ${vars.color.brand}`,
  outlineOffset: "2px",
})

globalStyle("button:focus-visible, a:focus-visible", {
  outline: `2px solid ${vars.color.brand}`,
  outlineOffset: "2px",
})
