import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const layout = style({
  height: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  background: vars.color.sidebarBg,
  overflow: "hidden",
})

export const layoutContainer = style({
  display: "flex",
  flex: 1,
  width: "100%",
  minHeight: 0,
})

export const withHeader = style({
  paddingTop: vars.layout.headerHeight,
})

export const main = style({
  flex: 1,
  minWidth: 0,
  width: "100%",
  // Flex column so the content region (docPage has flex: 1) grows to fill
  // short pages and the footer is pushed to the bottom of the scroll area.
  display: "flex",
  flexDirection: "column",
  background: vars.color.bg,
  overflowY: "auto",
  scrollPaddingTop: vars.space["2xl"],
  padding: `0 ${vars.space.xl} ${vars.space.xl}`,
  "@media": {
    "(max-width: 1024px)": {
      padding: `0 ${vars.space.md} ${vars.space.xl}`,
    },
  },
})

/** Opt-in document scrolling for sites that own chrome outside Ardo's frame. */
export const documentScroll = style({
  height: "auto",
  minHeight: "100vh",
  overflow: "visible",
})

export const documentScrollContainer = style({
  flex: "1 0 auto",
  minHeight: "auto",
})

export const documentScrollMain = style({
  minHeight: "auto",
  minWidth: 0,
  overflowY: "visible",
})

globalStyle(`${documentScroll} .ardo-sidebar`, {
  position: "sticky",
  top: vars.layout.headerHeight,
  alignSelf: "flex-start",
  height: `calc(100vh - ${vars.layout.headerHeight})`,
})

globalStyle(`${documentScroll} .ardo-page-rail`, {
  top: `calc(${vars.layout.headerHeight} + ${vars.space.xl})`,
})

export const home = style({
  height: "auto",
  minHeight: "100vh",
  overflow: "visible",
  background: "transparent",
})

export const homeMain = style({
  paddingTop: vars.layout.headerHeight,
})

export const skipLink = style({
  position: "absolute",
  top: "-100%",
  left: vars.space.md,
  zIndex: 200,
  padding: `0.75rem ${vars.space.lg}`,
  background: vars.color.brand,
  color: vars.color.brandInk,
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
