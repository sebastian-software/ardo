import { style } from "@vanilla-extract/css"
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
    marginTop: "0.125rem",
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
  fontSize: vars.fontSize.sm,
  lineHeight: 1.6,
})

export const containerTitle = recipe({
  base: {
    fontWeight: 600,
    fontSize: vars.fontSize.sm,
    marginBottom: vars.space.xs,
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
