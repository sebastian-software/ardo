import { style } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const tabs = style({
  margin: "20px 0",
})

export const tabList = style({
  display: "flex",
  borderBottom: `1px solid ${vars.color.border}`,
  gap: "4px",
})

export const tab = style({
  padding: "10px 18px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  color: vars.color.textLight,
  borderBottom: "2px solid transparent",
  marginBottom: "-1px",
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      color: vars.color.text,
    },
    "&.active": {
      color: vars.color.brand,
      borderBottomColor: vars.color.brand,
    },
  },
})

export const tabPanel = style({
  padding: "20px 0",
})

export const tabPanels = style({})
