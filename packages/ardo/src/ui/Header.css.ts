import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const header = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: `calc(${vars.layout.headerHeight} + env(safe-area-inset-top))`,
  paddingTop: "env(safe-area-inset-top)",
  background: vars.color.headerBg,
  backdropFilter: "blur(12px) saturate(1.6)",
  WebkitBackdropFilter: "blur(12px) saturate(1.6)",
  borderBottom: `1px solid ${vars.color.border}`,
  zIndex: 100,
  boxShadow: "0 1px 0 oklch(0 0 0 / 0.02)",
  "@supports": {
    "not (backdrop-filter: blur(12px))": {
      background: vars.color.bg,
    },
  },
})

const MOBILE = "(max-width: 1024px)"
const SMALL = "(max-width: 768px)"

/**
 * Three columns with equal outer tracks, so the search field sits at the
 * viewport center no matter how wide the logo or the actions are. The docs
 * content column moves with the sidebar and TOC; the viewport center does not.
 */
export const headerContainer = style({
  display: "grid",
  gridTemplateColumns: "1fr minmax(14rem, 26rem) 1fr",
  alignItems: "center",
  columnGap: vars.space.lg,
  height: vars.layout.headerHeight,
  padding: `0 ${vars.space.lg}`,
  "@media": {
    [MOBILE]: {
      gridTemplateColumns: "minmax(0, 1fr) auto auto",
      columnGap: vars.space.sm,
    },
    [SMALL]: {
      padding: `0 ${vars.space.md}`,
    },
  },
})

/** No center column: logo on the left, actions (and a search icon) on the right. */
export const headerContainerSplit = style({
  gridTemplateColumns: "minmax(0, 1fr) auto",
  "@media": {
    [MOBILE]: {
      gridTemplateColumns: "minmax(0, 1fr) auto",
    },
  },
})

/**
 * Bare pages: the header shares the page frame with the hero, features and
 * footer, so the logo lines up with the content edge.
 */
export const headerContainerPage = style({
  maxWidth: `calc(${vars.layout.pageMaxWidth} + 2 * ${vars.space.lg})`,
  margin: "0 auto",
})

export const headerLeft = style({
  gridColumn: 1,
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
  minWidth: 0,
  "@media": {
    [MOBILE]: {
      overflow: "hidden",
    },
  },
})

export const headerCenter = style({
  gridColumn: 2,
  display: "flex",
  justifyContent: "center",
  minWidth: 0,
})

export const headerRight = style({
  gridColumn: "-2 / -1",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  "@media": {
    [MOBILE]: {
      gap: vars.space.sm,
    },
  },
})

export const logoLink = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  minWidth: 0,
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

export const logoLight = style({
  selectors: {
    ".dark &": {
      display: "none",
    },
  },
})

export const logoDark = style({
  display: "none",
  selectors: {
    ".dark &": {
      display: "block",
    },
  },
})

export const siteTitle = style({
  fontSize: vars.fontSize.lg,
  fontWeight: 700,
  letterSpacing: "-0.025em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
})

export const mobileMenuButton = style({
  display: "none",
  flexShrink: 0,
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
    [MOBILE]: {
      display: "flex",
      alignItems: "center",
    },
  },
})

export const desktopNav = style({
  display: "flex",
  alignItems: "center",
  "@media": {
    [MOBILE]: {
      display: "none",
    },
  },
})

export const versionSwitcher = style({
  height: "2rem",
  maxWidth: "7rem",
  padding: "0 1.5rem 0 0.5rem",
  appearance: "none",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  background: vars.color.bg,
  color: vars.color.textLight,
  font: "inherit",
  fontSize: vars.fontSize.sm,
  lineHeight: 1,
  cursor: "pointer",
  selectors: {
    "&:hover": {
      color: vars.color.text,
      borderColor: vars.color.accent,
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "2px",
    },
  },
  "@media": {
    "(max-width: 480px)": {
      maxWidth: "6rem",
      fontSize: vars.fontSize.xs,
    },
  },
})

export const selectControl = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
})

export const localeSwitcher = style({
  paddingLeft: "1.65rem",
})

export const selectLeading = style({
  position: "absolute",
  left: "0.4rem",
  color: vars.color.textLight,
  pointerEvents: "none",
})

export const selectChevron = style({
  position: "absolute",
  right: "0.3rem",
  color: vars.color.textLight,
  pointerEvents: "none",
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

// Legacy - keep for backwards compat but unused
export const mobileMenu = style({ display: "none" })
export const mobileTopNav = style({ display: "none" })
export const mobileMenuContent = style({})
export const mobileMenuSection = style({})
export const mobileNav = style({})
