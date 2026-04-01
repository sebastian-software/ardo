import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  paddingTop: "env(safe-area-inset-top)",
  background: vars.color.sidebarBg,
  zIndex: 100,
})

export const headerContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "100%",
  padding: `0 ${vars.space.lg}`,
})

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.lg,
})

export const headerRight = style({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
})

export const logoLink = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  textDecoration: "none",
  color: vars.color.text,
  transition: `opacity ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      opacity: 0.8,
    },
  },
})

export const logo = style({
  height: "2.25rem",
})

export const siteTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  letterSpacing: "-0.025em",
})

export const mobileMenuButton = style({
  display: "none",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  color: vars.color.text,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
    },
  },
  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
      alignItems: "center",
    },
  },
})

export const hamburger = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
})

globalStyle(`${hamburger} span`, {
  display: "block",
  width: "1.25rem",
  height: "2px",
  background: vars.color.text,
  borderRadius: "1px",
  transition: `all ${vars.transition.fast}`,
})

export const desktopNav = style({
  display: "flex",
  alignItems: "center",
  "@media": {
    "(max-width: 1024px)": {
      display: "none",
    },
  },
})

// =============================================================================
// Mobile slide-in panel
// =============================================================================

export const mobileBackdrop = style({
  position: "fixed",
  inset: 0,
  zIndex: 150,
  background: "oklch(0 0 0 / 0.3)",
  transition: `opacity ${vars.transition.base}`,
  selectors: {
    '&[data-open="false"]': {
      opacity: 0,
      pointerEvents: "none",
    },
  },
})

export const mobilePanel = style({
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "min(20rem, 85vw)",
  zIndex: 151,
  background: vars.color.bg,
  overflowY: "auto",
  padding: `${vars.space.lg} ${vars.space.lg} ${vars.space.xl}`,
  transform: "translateX(0)",
  transition: `transform ${vars.transition.slow}`,
  selectors: {
    '&[data-open="false"]': {
      transform: "translateX(-100%)",
    },
  },
})

export const mobilePanelHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: vars.space.lg,
})

export const mobilePanelClose = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  color: vars.color.textLight,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
  },
})

export const mobilePanelNav = style({
  marginBottom: vars.space.lg,
  paddingBottom: vars.space.md,
  borderBottom: `1px solid ${vars.color.border}`,
})

globalStyle(`${mobilePanelNav} a`, {
  display: "block",
  padding: `${vars.space.sm} 0`,
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
})

// Force sidebar visible inside the mobile panel (overrides sidebar's display:none at 1024px)
export const mobilePanelSidebar = style({})

globalStyle(`${mobilePanelSidebar} > aside`, {
  display: "block",
  width: "100%",
  padding: 0,
})

// Legacy - keep for backwards compat but unused
export const mobileMenu = style({ display: "none" })
export const mobileTopNav = style({ display: "none" })
export const mobileMenuContent = style({})
export const mobileMenuSection = style({})
export const mobileNav = style({})
