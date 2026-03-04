import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const homeTechGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "20px",
  maxWidth: "800px",
  margin: "0 auto",
  "@media": {
    "(max-width: 768px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
})

export const homeTechItem = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
  padding: "24px 16px",
  background: vars.color.bg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  transition: `all ${vars.transition.base}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.brand,
    },
  },
  "@media": {
    "(hover: hover)": {
      selectors: {
        "&:hover": {
          transform: "translateY(-2px)",
        },
      },
    },
    "(prefers-reduced-motion: reduce)": {
      selectors: {
        "&:hover": {
          transform: "none",
        },
      },
    },
  },
})

globalStyle(`${homeTechItem} span`, {
  fontWeight: 600,
  fontSize: "14px",
})

export const homeTechIcon = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  background: vars.color.brandSubtle,
  borderRadius: vars.radius.base,
  color: vars.color.brand,
})
