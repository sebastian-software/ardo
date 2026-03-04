import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const homeComparison = style({
  overflowX: "auto",
})

export const homeComparisonTable = style({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  minWidth: "600px",
})

globalStyle(`${homeComparisonTable} th, ${homeComparisonTable} td`, {
  padding: "14px 18px",
  textAlign: "center",
  border: `1px solid ${vars.color.border}`,
})

globalStyle(`${homeComparisonTable} th`, {
  background: vars.color.bgSoft,
  fontWeight: 600,
  fontSize: "15px",
})

globalStyle(`${homeComparisonTable} td:first-child`, {
  textAlign: "left",
  fontWeight: 500,
  background: vars.color.bgSoft,
})

globalStyle(`${homeComparisonTable} .ardo-home-comparison-highlight`, {
  background: `${vars.color.brandSubtle} !important`,
})

globalStyle(`${homeComparisonTable} th.ardo-home-comparison-highlight`, {
  color: vars.color.brand,
})

export const homeCheck = style({
  color: vars.color.tip,
})

export const homeX = style({
  color: vars.color.textLighter,
})
