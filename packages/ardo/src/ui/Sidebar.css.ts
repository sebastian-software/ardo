import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const sidebar = style({
  position: "fixed",
  top: vars.layout.headerHeight,
  left: 0,
  width: vars.layout.sidebarWidth,
  height: `calc(100vh - ${vars.layout.headerHeight})`,
  padding: `1.75rem ${vars.space.md} 1.75rem 1.25rem`,
  overflowY: "auto",
  background: vars.color.sidebarBg,
  borderRight: `1px solid ${vars.color.sidebarBorder}`,
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
  marginLeft: vars.space.sm,
  marginTop: vars.space.xs,
  paddingLeft: "0.75rem",
  borderLeft: `1.5px solid ${vars.color.borderLight}`,
})

export const sidebarItem = style({})

export const sidebarItemHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
})

export const sidebarLink = style({
  display: "block",
  padding: `${vars.space.sm} 0.75rem`,
  margin: "1px 0",
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  letterSpacing: "-0.006em",
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
    },
  },
})

export const sidebarText = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.sm} 0.75rem ${vars.space.xs}`,
  marginTop: vars.space.md,
  color: vars.color.textLighter,
  textDecoration: "none",
  fontWeight: 700,
  fontSize: vars.fontSize.xs,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
    },
    "li:first-child > div > &": {
      marginTop: 0,
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
  padding: vars.space.xs,
  color: vars.color.textLighter,
  borderRadius: "50%",
  transition: `all ${vars.transition.base}`,
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

export const sidebarCollapseWrapper = style({
  display: "grid",
  gridTemplateRows: "1fr",
  transition: `grid-template-rows ${vars.transition.slow}`,
  selectors: {
    '&[data-collapsed="true"]': {
      gridTemplateRows: "0fr",
    },
  },
})

export const sidebarCollapseInner = style({
  overflow: "hidden",
  minHeight: 0,
})
