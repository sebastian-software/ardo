import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "./theme/contract.css"

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  paddingTop: "env(safe-area-inset-top)",
  background: "oklch(1 0 0 / 0.85)",
  backdropFilter: "blur(12px) saturate(1.5)",
  WebkitBackdropFilter: "blur(12px) saturate(1.5)",
  boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 1px 2px oklch(0 0 0 / 0.02)",
  zIndex: 100,
  selectors: {
    ".dark &": {
      background: "oklch(0.15 0.02 170 / 0.85)",
      boxShadow: "0 1px 3px oklch(0 0 0 / 0.15), 0 1px 2px oklch(0 0 0 / 0.1)",
    },
  },
})

export const headerContainer = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "100%",
  padding: "0 32px 0 20px",
  "@media": {
    "(max-width: 1024px)": {
      padding: "0 20px",
    },
  },
})

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: "24px",
})

export const headerRight = style({
  display: "flex",
  alignItems: "center",
  gap: "12px",
})

export const logoLink = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
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
  height: "36px",
})

export const siteTitle = style({
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
})

export const mobileMenuButton = style({
  display: "none",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px",
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
  gap: "5px",
})

globalStyle(`${hamburger} span`, {
  display: "block",
  width: "20px",
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
  padding: "12px 16px 16px",
  background: vars.color.bg,
  borderTop: `1px solid ${vars.color.border}`,
  boxShadow: "0 14px 28px oklch(0 0 0 / 0.08)",
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
  gap: "4px",
})

globalStyle(`${mobileNav} a`, {
  width: "100%",
})
