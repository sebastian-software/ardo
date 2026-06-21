import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

export const badge = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
    verticalAlign: "baseline",
    padding: `${vars.space.xs} ${vars.space.sm}`,
    border: "1px solid",
    borderRadius: vars.radius.lg,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
  },
  variants: {
    variant: {
      default: {
        background: vars.color.bgSoft,
        borderColor: vars.color.border,
        color: vars.color.textLight,
      },
      success: {
        background: vars.color.badgeGreenBg,
        borderColor: vars.color.badgeGreenBorder,
        color: vars.color.badgeGreen,
      },
      warning: {
        background: vars.color.badgeAmberBg,
        borderColor: vars.color.badgeAmberBorder,
        color: vars.color.badgeAmber,
      },
      danger: {
        background: vars.color.badgeRedBg,
        borderColor: vars.color.badgeRedBorder,
        color: vars.color.badgeRed,
      },
      info: {
        background: vars.color.badgeBlueBg,
        borderColor: vars.color.badgeBlueBorder,
        color: vars.color.badgeBlue,
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export const icon = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  lineHeight: 0,
})
