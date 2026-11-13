import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"
import { segmentTrack, segmentTrigger } from "./segmented.css"

export const tabs = style({
  margin: `${vars.space.lg} 0`,
})

export const tabList = style([
  segmentTrack,
  {
    display: "inline-flex",
    maxWidth: "100%",
    borderRadius: vars.radius.base,
  },
])

export const tab = style([segmentTrigger])

// Ferromark wraps a one-line label (`<Tab>npm</Tab>`) in a paragraph; keep it inline.
globalStyle(`${tab} > p`, {
  display: "inline",
  margin: 0,
  font: "inherit",
})

export const tabPanel = style({
  marginTop: vars.space.sm,
  selectors: {
    // `hidden="until-found"` keeps the panel's box, so drop its spacing too.
    "&[hidden]": {
      marginTop: 0,
    },
    "&:focus-visible": {
      outline: "none",
      borderRadius: vars.radius.base,
      boxShadow: `0 0 0 3px ${vars.color.ring}`,
    },
  },
})

// Prose margins would add space around the panel that the track already sets.
globalStyle(`${tabPanel} > :first-child`, { marginTop: 0 })
globalStyle(`${tabPanel} > :last-child`, { marginBottom: 0 })

export const tabPanels = style({})
