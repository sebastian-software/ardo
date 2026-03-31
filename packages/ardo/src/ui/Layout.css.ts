import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const layout = style({
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  background: vars.color.sidebarBg,
  overflow: "hidden",
})

export const layoutContainer = style({
  display: "flex",
  flex: 1,
  paddingTop: vars.layout.headerHeight,
  minHeight: 0,
})

export const main = style({
  flex: 1,
  minWidth: 0,
  marginRight: vars.space.sm,
  marginBottom: vars.space.sm,
  background: vars.color.bg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  // Content scrolls inside the card
  overflowY: "auto",
  padding: vars.space.xl,
  "@media": {
    "(max-width: 1024px)": {
      marginRight: 0,
      marginBottom: 0,
      borderRadius: 0,
      border: "none",
    },
  },
})

export const home = style({
  height: "auto",
  minHeight: "100vh",
  overflow: "visible",
})

export const homeMain = style({
  paddingTop: vars.layout.headerHeight,
})

// No card styling on home page
globalStyle(`${home} .${main}`, {
  marginLeft: 0,
  padding: 0,
  margin: 0,
  borderRadius: 0,
  border: "none",
  background: vars.color.bg,
  overflow: "visible",
})

export const skipLink = style({
  position: "absolute",
  top: "-100%",
  left: vars.space.md,
  zIndex: 200,
  padding: `0.75rem ${vars.space.lg}`,
  background: vars.color.brand,
  color: "white",
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  textDecoration: "none",
  borderRadius: vars.radius.base,
  boxShadow: vars.color.shadowMd,
  selectors: {
    "&:focus": {
      top: vars.space.md,
    },
  },
})
