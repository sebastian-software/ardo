import { globalStyle, style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

// Banners reuse the callout palette, so each variant matches the callout with the same name.
export const banner = recipe({
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    margin: `0 0 ${vars.space.lg}`,
    padding: `${vars.space.smd} ${vars.space.md}`,
    borderRadius: vars.radius.base,
    border: "1px solid",
    color: vars.color.text,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.5,
  },
  variants: {
    variant: {
      tip: { background: vars.color.tipBg, borderColor: vars.color.tipBorder },
      warning: { background: vars.color.warningBg, borderColor: vars.color.warningBorder },
      danger: { background: vars.color.dangerBg, borderColor: vars.color.dangerBorder },
      info: { background: vars.color.infoBg, borderColor: vars.color.infoBorder },
      note: { background: vars.color.noteBg, borderColor: vars.color.noteBorder },
    },
  },
})

export const bannerIcon = recipe({
  base: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    // One line of banner text tall, so the icon centers on the first line.
    height: "1lh",
  },
  variants: {
    variant: {
      tip: { color: vars.color.tip },
      warning: { color: vars.color.warning },
      danger: { color: vars.color.danger },
      info: { color: vars.color.info },
      note: { color: vars.color.note },
    },
  },
})

export const bannerBody = style({
  flex: 1,
  minWidth: 0,
  overflowWrap: "anywhere",
})

globalStyle(`${bannerBody} > :first-child`, {
  marginTop: 0,
})

globalStyle(`${bannerBody} > :last-child`, {
  marginBottom: 0,
})

export const dismiss = style({
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  padding: 0,
  border: 0,
  borderRadius: vars.radius.base,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  selectors: {
    "&:hover": { background: "color-mix(in srgb, currentColor 12%, transparent)" },
    "&:focus-visible": { outline: `2px solid ${vars.color.ring}`, outlineOffset: "2px" },
  },
})
