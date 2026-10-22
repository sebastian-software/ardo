import { style } from "@vanilla-extract/css"

import { vars } from "./theme/contract.css"

/** Label and select in one row, at the end of the sidebar or in the footer. */
export const versionControl = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm,
  flexShrink: 0,
})

/** At the end of the sidebar, below the scrolling navigation. */
export const versionControlDivided = style({
  paddingTop: vars.space.smd,
  marginTop: vars.space.sm,
  borderTop: `1px solid ${vars.color.divider}`,
})

export const controlLabel = style({
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
})

export const versionBanner = style({
  margin: `0 0 ${vars.space.lg}`,
  padding: `${vars.space.smd} ${vars.space.md}`,
  borderRadius: vars.radius.base,
  border: `1px solid ${vars.color.warningBorder}`,
  background: vars.color.warningBg,
  color: vars.color.text,
  fontSize: vars.fontSize.sm,
  lineHeight: 1.5,
})

export const versionBannerLink = style({
  color: vars.color.text,
  fontWeight: 600,
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.2em",
})

/** The mobile menu's closing section: version, language, appearance and links. */
export const panelSettings = style({
  marginTop: vars.space.lg,
  paddingTop: vars.space.sm,
  borderTop: `1px solid ${vars.color.border}`,
})

export const panelSettingsRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.md,
  minHeight: "2.75rem",
  fontSize: vars.fontSize.sm,
  color: vars.color.textLight,
})

export const panelSettingsLinks = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
})
