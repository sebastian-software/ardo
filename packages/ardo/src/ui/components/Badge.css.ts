import { recipe } from "@vanilla-extract/recipes"

import { vars } from "../theme/contract.css"

export const badge = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    verticalAlign: "baseline",
    padding: "0.125rem 0.45rem",
    border: "1px solid",
    borderRadius: "999px",
    fontSize: "0.75em",
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
        background: vars.color.dangerBg,
        borderColor: vars.color.dangerBorder,
        color: vars.color.danger,
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

export const icon = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    lineHeight: 0,
  },
})
