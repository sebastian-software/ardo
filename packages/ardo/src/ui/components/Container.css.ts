import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"
import { vars } from "../theme/contract.css"

export const container = recipe({
  base: {
    margin: "16px 0",
    padding: "12px 16px",
    borderRadius: vars.radius.base,
    border: "1px solid",
    borderLeft: "4px solid",
  },
  variants: {
    type: {
      tip: {
        background: vars.color.tipBg,
        borderColor: vars.color.tipBorder,
        borderLeftColor: vars.color.tip,
      },
      warning: {
        background: vars.color.warningBg,
        borderColor: vars.color.warningBorder,
        borderLeftColor: vars.color.warning,
      },
      danger: {
        background: vars.color.dangerBg,
        borderColor: vars.color.dangerBorder,
        borderLeftColor: vars.color.danger,
      },
      info: {
        background: vars.color.infoBg,
        borderColor: vars.color.infoBorder,
        borderLeftColor: vars.color.info,
      },
      note: {
        background: vars.color.noteBg,
        borderColor: vars.color.noteBorder,
        borderLeftColor: vars.color.note,
      },
    },
  },
})

export const containerTitle = recipe({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "8px",
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

export const containerContent = style({
  fontSize: "14px",
  lineHeight: 1.6,
})
