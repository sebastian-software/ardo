import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const sidebar = style({
  width: vars.layout.sidebarWidth,
  flexShrink: 0,
  display: "flex",
  minHeight: 0,
  borderRight: `1px solid ${vars.color.sidebarBorder}`,
  background: "transparent",
  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
})

export const sidebarRail = style({
  width: "4rem",
  flexShrink: 0,
  padding: `${vars.space.md} 0`,
  borderRight: `1px solid ${vars.color.sidebarBorder}`,
  background: vars.color.bgSoft,
})

export const sidebarRailItem = style({
  position: "relative",
})

export const sidebarRailLabel = style({
  position: "absolute",
  left: "calc(100% + 0.75rem)",
  top: "50%",
  transform: "translateY(-50%) translateX(-4px)",
  padding: "0.375rem 0.625rem",
  background: vars.color.text,
  color: vars.color.bg,
  fontSize: vars.fontSize.xs,
  fontWeight: 500,
  borderRadius: vars.radius.sm,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  opacity: 0,
  transition: `opacity ${vars.transition.fast}, transform ${vars.transition.fast}`,
  selectors: {
    [`${sidebarRailItem}:hover &`]: {
      opacity: 1,
      transform: "translateY(-50%) translateX(0)",
      transitionDelay: "200ms",
    },
  },
  zIndex: 50,
})

export const sidebarRailList = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.xs,
  listStyle: "none",
})

export const sidebarRailLink = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.5rem",
  height: "2.5rem",
  color: vars.color.textLight,
  borderRadius: vars.radius.base,
  textDecoration: "none",
  transition: `background ${vars.transition.fast}, color ${vars.transition.fast}, box-shadow ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bg,
      boxShadow: vars.color.shadowSm,
    },
    "&.active": {
      color: vars.color.brand,
      background: vars.color.brandSubtle,
      boxShadow: `inset 0 0 0 1px ${vars.color.borderLight}`,
    },
    "&.active::before": {
      content: '""',
      position: "absolute",
      left: "-0.75rem",
      top: "0.75rem",
      bottom: "0.75rem",
      width: "2px",
      borderRadius: "999px",
      background: vars.color.brand,
    },
  },
})

export const sidebarPanel = style({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: 1,
  padding: `${vars.space.md} ${vars.space.md} ${vars.space.md} 1.125rem`,
})

export const sidebarHeader = style({
  flexShrink: 0,
  marginBottom: vars.space.lg,
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
  selectors: {
    "li:not(:first-child) > &": {
      marginTop: vars.space.lg,
    },
  },
})

export const sidebarLink = style({
  display: "block",
  padding: `0.375rem 0.75rem`,
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  borderLeft: "2px solid transparent",
  borderRadius: `0 ${vars.radius.base} ${vars.radius.base} 0`,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgSoft,
    },
    "&.active": {
      color: vars.color.brand,
      background: vars.color.brandSubtle,
      borderLeftColor: vars.color.brand,
      fontWeight: 500,
    },
  },
})

// Section title (top-level group heading like "Get started", "Organize")
export const sidebarText = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `0.5rem 0.75rem 0.375rem`,
  color: vars.color.textLight,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  letterSpacing: "-0.005em",
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
    },
    "&.child-active": {
      color: vars.color.text,
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
