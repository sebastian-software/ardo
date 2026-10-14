import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

// The sidebar only renders inside the mobile drawer below this width, where
// the section tabs lie flat above the tree instead of standing on the edge.
const drawerWidth = "(max-width: 1024px)"

/**
 * Strip of section tabs on the sidebar's outer edge. It is the darkest of the
 * three stacked surfaces (tabs < panel < content); the active tab takes the
 * panel color so it reads as attached to the panel, like a register tab.
 */
export const sectionTabs = style({
  width: "2.25rem",
  flexShrink: 0,
  padding: `${vars.space.md} 0 ${vars.space.md} 0.3125rem`,
  background: vars.color.sidebarRailBg,
  overflowY: "auto",
  scrollbarWidth: "none",
  "@media": {
    [drawerWidth]: {
      width: "auto",
      padding: 0,
      marginBottom: vars.space.lg,
      background: "transparent",
      overflow: "visible",
    },
  },
})

export const sectionTabList = style({
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  margin: 0,
  padding: 0,
  listStyle: "none",
  "@media": {
    [drawerWidth]: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: vars.space.sm,
    },
  },
})

export const sectionTab = style({
  display: "flex",
  justifyContent: "center",
  padding: "0.875rem 0",
  color: vars.color.textLight,
  fontSize: "0.8125rem",
  fontWeight: 500,
  letterSpacing: "0.01em",
  textDecoration: "none",
  borderRadius: `${vars.radius.base} 0 0 ${vars.radius.base}`,
  transition: `background ${vars.transition.fast}, color ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
      background: `color-mix(in oklch, ${vars.color.sidebarBg} 55%, transparent)`,
    },
    "&.active": {
      color: vars.color.text,
      background: vars.color.sidebarBg,
    },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.accent}`,
      outlineOffset: "-2px",
    },
  },
  "@media": {
    [drawerWidth]: {
      padding: "0.375rem 0.75rem",
      border: `1px solid ${vars.color.divider}`,
      borderRadius: vars.radius.full,
      fontSize: vars.fontSize.sm,
      selectors: {
        "&.active": {
          color: vars.color.brand,
          borderColor: `color-mix(in oklch, ${vars.color.brand} 35%, transparent)`,
          background: `color-mix(in oklch, ${vars.color.brand} 8%, transparent)`,
        },
      },
    },
  },
})

/**
 * Turns the tab content into a vertical label: `vertical-rl` stands the text
 * up, the half turn makes it read bottom to top, so the icon (first child)
 * sits at the bottom where the label starts.
 */
export const sectionTabInner = style({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  whiteSpace: "nowrap",
  writingMode: "vertical-rl",
  transform: "rotate(180deg)",
  "@media": {
    [drawerWidth]: {
      writingMode: "horizontal-tb",
      transform: "none",
    },
  },
})

/** Icons stay upright in vertical text, so turn them to match the label. */
export const sectionTabIcon = style({
  display: "flex",
  flexShrink: 0,
  color: vars.color.textLighter,
  transform: "rotate(90deg)",
  transition: `color ${vars.transition.fast}`,
  selectors: {
    [`${sectionTab}:hover &, ${sectionTab}.active &`]: {
      color: vars.color.brand,
    },
  },
  "@media": {
    [drawerWidth]: {
      transform: "none",
    },
  },
})
