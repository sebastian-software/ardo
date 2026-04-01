import { globalStyle, style } from "@vanilla-extract/css"

import { vars } from "../theme/contract.css"

export const search = style({
  position: "relative",
  width: "100%",
  maxWidth: "100%",
})

export const searchField = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  minHeight: "2.5rem",
  padding: `${vars.space.sm} 0.75rem`,
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  color: vars.color.textLighter,
  cursor: "text",
  transition: `border-color ${vars.transition.fast}, box-shadow ${vars.transition.fast}, color ${vars.transition.fast}`,
  outline: "none",
})

globalStyle(`${search}:focus-within ${searchField}`, {
  borderColor: vars.color.brand,
  color: vars.color.textLight,
})

globalStyle(`${searchField}:focus-within`, {
  outline: "none",
})

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  fontSize: vars.fontSize.sm,
  background: "none",
  color: vars.color.text,
  "::placeholder": {
    color: vars.color.textLighter,
  },
  selectors: {
    "&:focus-visible": {
      outline: "none",
    },
  },
})

export const searchPopover = style({
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  left: 0,
  width: "min(28rem, calc(100vw - 2rem))",
  background: vars.color.bg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowLg,
  overflow: "hidden",
  zIndex: 210,
})

export const searchResults = style({
  listStyle: "none",
  maxHeight: "25rem",
  overflowY: "auto",
})

export const searchResult = style({
  display: "block",
  padding: `0.75rem ${vars.space.md}`,
  textDecoration: "none",
  color: vars.color.text,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  transition: `background ${vars.transition.fast}`,
  selectors: {
    "&:last-child": {
      borderBottom: "none",
    },
    "&:hover, &.selected": {
      background: vars.color.brandSubtle,
    },
  },
})

export const searchResultTitle = style({
  display: "block",
  fontWeight: 500,
  marginBottom: "2px",
})

export const searchResultSection = style({
  display: "block",
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
})

export const searchNoResults = style({
  padding: `${vars.space.xl} ${vars.space.md}`,
  textAlign: "center",
  color: vars.color.textLighter,
})

export const searchFooter = style({
  display: "flex",
  justifyContent: "center",
  gap: vars.space.lg,
  padding: `0.75rem ${vars.space.md}`,
  background: vars.color.bgSoft,
  borderTop: `1px solid ${vars.color.border}`,
  fontSize: vars.fontSize.xs,
  color: vars.color.textLighter,
})

globalStyle(`${searchFooter} kbd`, {
  padding: "2px 6px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  marginRight: "4px",
})

export const searchClear = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.5rem",
  height: "1.5rem",
  flexShrink: 0,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: vars.fontSize.lg,
  color: vars.color.textLighter,
  padding: vars.space.xs,
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
      color: vars.color.text,
    },
  },
})

export const searchKbd = style({
  display: "flex",
  gap: "3px",
  marginLeft: vars.space.xs,
})

globalStyle(`${searchKbd} kbd`, {
  padding: "2px 6px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.fontSize.xs,
  fontFamily: vars.font.family,
})
