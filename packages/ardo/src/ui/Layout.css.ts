import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const layout = style({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
})

export const layoutContainer = style({
  display: "flex",
  flex: 1,
  paddingTop: vars.layout.headerHeight,
})

export const main = style({
  flex: 1,
  minWidth: 0,
  padding: "40px 32px",
  marginLeft: vars.layout.sidebarWidth,
  "@media": {
    "(max-width: 1024px)": {
      marginLeft: 0,
    },
  },
})

export const home = style({
  minHeight: "100vh",
})

export const homeMain = style({
  paddingTop: vars.layout.headerHeight,
})

// No sidebar margin and no padding on home page
globalStyle(`${home} .${main}`, {
  marginLeft: 0,
  padding: 0,
})

export const skipLink = style({
  position: "absolute",
  top: "-100%",
  left: "16px",
  zIndex: 200,
  padding: "12px 24px",
  background: vars.color.brand,
  color: "white",
  fontWeight: 600,
  fontSize: "14px",
  textDecoration: "none",
  borderRadius: vars.radius.base,
  boxShadow: vars.color.shadowMd,
  selectors: {
    "&:focus": {
      top: "16px",
    },
  },
})
