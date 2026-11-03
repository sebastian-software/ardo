import { globalStyle, style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

export const container = recipe({
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space.md,
    margin: `${vars.space.md} 0`,
    padding: `${vars.space.md} ${vars.space.lg}`,
    borderRadius: vars.radius.lg,
    border: "1px solid",
  },
  variants: {
    type: {
      tip: {
        background: vars.color.tipBg,
        borderColor: vars.color.tipBorder,
        color: vars.color.tip,
      },
      warning: {
        background: vars.color.warningBg,
        borderColor: vars.color.warningBorder,
        color: vars.color.warning,
      },
      danger: {
        background: vars.color.dangerBg,
        borderColor: vars.color.dangerBorder,
        color: vars.color.danger,
      },
      info: {
        background: vars.color.infoBg,
        borderColor: vars.color.infoBorder,
        color: vars.color.info,
      },
      note: {
        background: vars.color.noteBg,
        borderColor: vars.color.noteBorder,
        color: vars.color.note,
      },
    },
  },
})

export const containerIcon = recipe({
  base: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    // One line of callout text tall, so the icon centers on the first line.
    fontSize: vars.fontSize.base,
    lineHeight: vars.font.lineHeight,
    height: "1lh",
  },
  variants: {
    type: {
      tip: { color: vars.color.tip },
      warning: { color: vars.color.warning },
      danger: { color: vars.color.danger },
      info: { color: vars.color.info },
      note: { color: vars.color.note },
    },
  },
})

export const containerBody = style({
  flex: 1,
  minWidth: 0,
  color: vars.color.text,
  // Callouts hold prose, so title and text use the reading size of the page.
  fontSize: vars.fontSize.base,
  lineHeight: vars.font.lineHeight,
})

export const containerTitle = recipe({
  base: {
    fontWeight: 600,
    fontSize: "inherit",
    lineHeight: "inherit",
    margin: `0 0 ${vars.space.xs}`,
  },
  variants: {
    type: {
      tip: { color: vars.color.tip },
      warning: { color: vars.color.warning },
      danger: { color: vars.color.danger },
      info: { color: vars.color.info },
      note: { color: vars.color.note },
    },
  },
})

export const containerContent = style({})

// GFM-alert callouts wrap their text in an MDX <p>, which inherits the
// global content paragraph margin. Collapse the outer margins so the
// callout's own padding sets the box height; inner gaps between multiple
// paragraphs are kept.
globalStyle(`${containerContent} > :first-child`, {
  marginTop: 0,
})

globalStyle(`${containerContent} > :last-child`, {
  marginBottom: 0,
})
