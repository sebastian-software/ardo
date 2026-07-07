import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

export const sidebar = style({
  width: vars.layout.sidebarWidth,
  flexShrink: 0,
  display: "flex",
  minHeight: 0,
  // No border to the content: the panel (sidebarBg) and the content (bg) are
  // separated by a surface-brightness step, not a hairline.
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
  // The rail is the darkest of the three stacked surfaces (rail < panel <
  // content). The brightness step replaces the former divider line.
  background: vars.color.sidebarRailBg,
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
  margin: 0,
  padding: 0,
  listStyle: "none",
})

export const sidebarRailLink = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.5rem",
  height: "2.5rem",
  color: vars.color.textLighter,
  borderRadius: vars.radius.base,
  textDecoration: "none",
  transition: `background ${vars.transition.fast}, color ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgMute,
    },
    "&.active": {
      color: vars.color.brand,
      background: vars.color.bgMute,
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
  margin: 0,
  padding: 0,
  listStyle: "none",
})

export const sidebarList0 = style({
  position: "relative",
})

/**
 * Trunk line that threads the top-level group nodes together. Added only to
 * lists that actually render nodes, so lists without nodes stay line-free.
 */
export const sidebarTrunk = style({
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      left: "17px",
      top: "22px",
      bottom: "22px",
      width: "1.5px",
      background: vars.color.divider,
    },
  },
})

export const sidebarList1 = style({
  marginTop: "2px",
  // Align child text flush under the group title (past the node circle).
  paddingLeft: "33px",
})

export const sidebarItem = style({})

/** Header row for a top-level group: node + title + chevron, as one capsule. */
export const sidebarNodeHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `4px ${vars.space.sm} 4px 0`,
  border: "1px solid transparent",
  borderRadius: "999px",
  transition: `background ${vars.transition.fast}, border-color ${vars.transition.fast}`,
  selectors: {
    "&.active, &.child-active": {
      background: `color-mix(in oklch, ${vars.color.brand} 6%, transparent)`,
      borderColor: `color-mix(in oklch, ${vars.color.brand} 30%, transparent)`,
    },
  },
})

/**
 * Circular node that sits on the trunk line next to a top-level group. Its
 * opaque panel-coloured fill masks the trunk behind it, so the line reads as
 * threading through a bead.
 */
export const sidebarNode = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "28px",
  height: "28px",
  marginLeft: "4px",
  borderRadius: "50%",
  border: `1px solid ${vars.color.divider}`,
  background: vars.color.sidebarBg,
  color: vars.color.textLighter,
  position: "relative",
  zIndex: 1,
  transition: `border-color ${vars.transition.fast}, color ${vars.transition.fast}`,
  selectors: {
    [`${sidebarNodeHeader}.active &, ${sidebarNodeHeader}.child-active &`]: {
      borderColor: `color-mix(in oklch, ${vars.color.brand} 45%, transparent)`,
      color: vars.color.brand,
    },
  },
})

/** Group title inside a node header — carries no pill of its own; the capsule provides it. */
export const sidebarNodeTitle = style({
  flex: 1,
  minWidth: 0,
  display: "block",
  color: vars.color.text,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: vars.fontSize.sm,
  letterSpacing: "-0.005em",
  padding: "2px 0",
  background: "none",
  border: "none",
  appearance: "none",
  WebkitAppearance: "none",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  selectors: {
    [`${sidebarNodeHeader}.active &, ${sidebarNodeHeader}.child-active &`]: {
      color: vars.color.brand,
    },
  },
})

/**
 * Applied to `<li>` items that contain a collapsible group. Groups get
 * breathing room above them; plain links sit tight together (their own
 * padding provides the rhythm).
 */
export const sidebarItemGroup = style({
  selectors: {
    "&:not(:first-child)": {
      marginTop: vars.space.lg,
    },
  },
})

export const sidebarItemHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
})

export const sidebarLink = style({
  display: "block",
  padding: `0.375rem 0.625rem`,
  color: vars.color.textLight,
  textDecoration: "none",
  fontSize: vars.fontSize.sm,
  fontWeight: 400,
  borderRadius: vars.radius.base,
  transition: `color ${vars.transition.fast}, background ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: vars.color.bgMute,
    },
    "&.active": {
      color: vars.color.brand,
      background: `color-mix(in oklch, ${vars.color.brand} 9%, transparent)`,
      fontWeight: 500,
    },
    // A linked parent whose child is active: emphasised, but not the full
    // active fill — only the exact child gets that.
    "&.child-active": {
      color: vars.color.text,
      fontWeight: 500,
    },
  },
})

// Section title (top-level group heading like "Get started", "Organize")
export const sidebarText = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `0.5rem 0.625rem 0.375rem`,
  color: vars.color.text,
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
  justifyContent: "space-between",
})

export const sidebarToggleChevron = style({
  display: "flex",
  alignItems: "center",
  color: vars.color.textLighter,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&.collapsed": {
      transform: "rotate(-90deg)",
    },
  },
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
