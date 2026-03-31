import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  paddingTop: "env(safe-area-inset-top)",
  background: "oklch(1 0 0 / 0.88)",
  backdropFilter: "blur(16px) saturate(1.8)",
  WebkitBackdropFilter: "blur(16px) saturate(1.8)",
  boxShadow: "0 1px 0 oklch(0 0 0 / 0.04)",
  zIndex: 100,
  selectors: {
    ".dark &": {
      background: "oklch(0.14 0.01 170 / 0.88)",
      boxShadow: "0 1px 0 oklch(1 0 0 / 0.06)",
    },
  },
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
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      display: "block",
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
    "(max-width: 768px)": {
      display: "none",
    },
  },
})

export const mobileMenu = style({
  position: "fixed",
  top: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  left: 0,
  right: 0,
  padding: `0.75rem ${vars.space.md} ${vars.space.md}`,
  background: vars.color.bg,
  borderTop: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowLg,
  zIndex: 99,
})

export const mobileTopNav = style({
  display: "none",
  "@media": {
    "(max-width: 768px)": {
      display: "block",
    },
  },
})

export const mobileMenuContent = style({})

export const mobileMenuSection = style({})

export const mobileNav = style({})

globalStyle(`${mobileNav} nav`, {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: vars.space.xs,
})

globalStyle(`${mobileNav} a`, {
  width: "100%",
})
