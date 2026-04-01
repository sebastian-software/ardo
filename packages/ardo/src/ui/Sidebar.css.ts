import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const sidebar = style({
  width: vars.layout.sidebarWidth,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  padding: `${vars.space.md} ${vars.space.md} ${vars.space.md} 1.25rem`,
  overflow: "visible",
  background: "transparent",
  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
})

export const sidebarHeader = style({
  flexShrink: 0,
  marginBottom: vars.space.md,
  position: "relative",
})

export const sidebarNav = style({
  flex: 1,
  overflowY: "auto",
  minHeight: 0,
})

export const sidebarList = style({
  listStyle: "none",
})

export const sidebarList0 = style({})

export const sidebarList1 = style({
  marginLeft: "0.75rem",
  marginTop: "2px",
})

export const sidebarItem = style({})

export const sidebarItemHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
})

export const sidebarLink = style({
  display: "block",
  padding: `0.25rem 0.75rem`,
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  borderRadius: vars.radius.base,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
      background: vars.color.brandSubtle,
      fontWeight: 500,
    },
  },
})

// Section title (top-level group heading like "Get started", "Organize")
export const sidebarText = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `0.375rem 0`,
  marginTop: vars.space.lg,
  color: vars.color.text,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
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
  display: "flex",
  alignItems: "center",
  alignSelf: "center",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: vars.space.xs,
  color: vars.color.textLighter,
  borderRadius: "50%",
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
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
