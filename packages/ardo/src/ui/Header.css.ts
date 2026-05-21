import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  paddingTop: "env(safe-area-inset-top)",
  // Brand-tinted chrome: the top bar reads as part of the app's identity
  // zone, distinct from the neutral content surface.
  background: `color-mix(in oklch, ${vars.color.brandSubtle} 70%, ${vars.color.bg})`,
  borderBottom: `1px solid ${vars.color.border}`,
  zIndex: 100,
  boxShadow: "0 1px 0 oklch(0 0 0 / 0.02)",
  "@media": {
    "(max-width: 1024px)": {
      height: `calc(${vars.layout.headerHeight} + 2.75rem + env(safe-area-inset-top))`,
    },
  },
})

export const headerContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: vars.layout.headerHeight,
  padding: `0 ${vars.space.lg}`,
  "@media": {
    "(max-width: 640px)": {
      padding: `0 ${vars.space.md}`,
    },
  },
})

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
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
  height: "2rem",
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

export const mobileNavStrip = style({
  display: "none",
  height: "2.75rem",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "auto",
  overflowY: "hidden",
  borderTop: `1px solid ${vars.color.borderLight}`,
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  "@media": {
    "(max-width: 1024px)": {
      display: "flex",
      alignItems: "center",
      padding: `0 ${vars.space.md}`,
    },
  },
})

globalStyle(`${mobileNavStrip} nav`, {
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  width: "max-content",
  flexShrink: 0,
})

globalStyle(`${mobileNavStrip} a, ${mobileNavStrip} span`, {
  whiteSpace: "nowrap",
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
  width: "min(22rem, 88vw)",
  zIndex: 151,
  background: vars.color.bg,
  overflowY: "auto",
  padding: `${vars.space.lg} ${vars.space.lg} ${vars.space.xl}`,
  borderRight: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowLg,
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
  borderRadius: vars.radius.base,
  color: vars.color.textLight,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgMute,
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
  borderRight: "none",
})

globalStyle(`${mobilePanelSidebar} nav[aria-label="Documentation sections"]`, {
  display: "none",
})

// Legacy - keep for backwards compat but unused
export const mobileMenu = style({ display: "none" })
export const mobileTopNav = style({ display: "none" })
export const mobileMenuContent = style({})
export const mobileMenuSection = style({})
export const mobileNav = style({})
