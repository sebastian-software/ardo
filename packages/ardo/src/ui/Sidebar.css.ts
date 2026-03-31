import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const sidebar = style({
  position: "fixed",
  top: vars.layout.headerHeight,
  left: 0,
  width: vars.layout.sidebarWidth,
  height: `calc(100vh - ${vars.layout.headerHeight})`,
  padding: "24px 20px",
  overflowY: "auto",
  boxShadow: "1px 0 3px oklch(0 0 0 / 0.03)",
  background: vars.color.sidebarBg,
  selectors: {
    ".dark &": {
      boxShadow: "1px 0 3px oklch(0 0 0 / 0.1)",
    },
  },
  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
})

export const sidebarList = style({
  listStyle: "none",
})

export const sidebarList0 = style({})

export const sidebarList1 = style({
  marginLeft: "12px",
  marginTop: "6px",
  paddingLeft: "12px",
  borderLeft: `1px solid ${vars.color.borderLight}`,
})

export const sidebarItem = style({})

export const sidebarItemHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
})

export const sidebarLink = style({
  display: "block",
  padding: "6px 10px",
  margin: "2px 0",
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: "14px",
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgMute,
    },
    "&.active": {
      color: vars.color.brand,
      background: vars.color.brandSubtle,
      fontWeight: 500,
      borderLeft: `3px solid ${vars.color.brand}`,
      paddingLeft: "7px",
    },
  },
})

export const sidebarText = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  color: vars.color.textLighter,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&::before": {
      content: '""',
      width: "5px",
      height: "5px",
      borderRadius: "50%",
      background: vars.color.brand,
      opacity: 0.5,
      flexShrink: 0,
    },
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
    },
  },
})

export const sidebarTextButton = style({
  width: "100%",
  background: "none",
  border: "none",
  appearance: "none",
  WebkitAppearance: "none",
  fontFamily: "inherit",
  lineHeight: "inherit",
  textAlign: "left",
  cursor: "pointer",
})

export const sidebarCollapse = style({
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "6px",
  color: vars.color.textLighter,
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgMute,
      color: vars.color.text,
    },
    "&.collapsed": {
      transform: "rotate(-90deg)",
    },
  },
})
