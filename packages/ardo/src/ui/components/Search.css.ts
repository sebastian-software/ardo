import { style, globalStyle } from "@vanilla-extract/css"
import { vars } from "../theme/contract.css"

export const search = style({
  position: "relative",
  width: "clamp(220px, 30vw, 360px)",
  maxWidth: "100%",
  transition: `width ${vars.transition.fast}`,
  "@media": {
    "(max-width: 768px)": {
      width: "40px",
    },
  },
})

export const searchField = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "40px",
  padding: "8px 12px",
  background: vars.color.bgSoft,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.base,
  color: vars.color.textLighter,
  cursor: "text",
  transition: `border-color ${vars.transition.fast}, box-shadow ${vars.transition.fast}, color ${vars.transition.fast}`,
  "@media": {
    "(max-width: 768px)": {
      width: "40px",
      gap: 0,
      padding: "8px",
    },
  },
})

globalStyle(`${search}:hover ${searchField}, ${search}:focus-within ${searchField}`, {
  borderColor: vars.color.brand,
  color: vars.color.textLight,
  boxShadow: "0 0 0 3px oklch(0.48 0.15 170 / 0.14)",
})

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  fontSize: "14px",
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
  "@media": {
    "(max-width: 768px)": {
      flex: "0 0 auto",
      width: 0,
      opacity: 0,
      pointerEvents: "none",
    },
  },
})

export const searchPopover = style({
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "min(560px, calc(100vw - 24px))",
  background: vars.color.bg,
  borderRadius: "16px",
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.color.shadowLg,
  overflow: "hidden",
  zIndex: 210,
  "@media": {
    "(max-width: 768px)": {
      right: 0,
      width: "min(420px, calc(100vw - 20px))",
    },
  },
})

export const searchResults = style({
  listStyle: "none",
  maxHeight: "400px",
  overflowY: "auto",
})

export const searchResult = style({
  display: "block",
  padding: "12px 20px",
  textDecoration: "none",
  color: vars.color.text,
  borderBottom: `1px solid ${vars.color.borderLight}`,
  transition: `background ${vars.transition.fast}`,
  selectors: {
    "&:last-child": {
      borderBottom: "none",
    },
    "&:hover, &.selected": {
      background: "oklch(0.48 0.15 170 / 0.05)",
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
  fontSize: "13px",
  color: vars.color.textLighter,
})

export const searchNoResults = style({
  padding: "32px 20px",
  textAlign: "center",
  color: vars.color.textLighter,
})

export const searchFooter = style({
  display: "flex",
  justifyContent: "center",
  gap: "24px",
  padding: "12px 20px",
  background: vars.color.bgSoft,
  borderTop: `1px solid ${vars.color.border}`,
  fontSize: "12px",
  color: vars.color.textLighter,
  "@media": {
    "(max-width: 768px)": {
      display: "none",
    },
  },
})

globalStyle(`${searchFooter} kbd`, {
  padding: "2px 6px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: "4px",
  marginRight: "4px",
})

export const searchClear = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  flexShrink: 0,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  color: vars.color.textLighter,
  padding: "4px",
  borderRadius: vars.radius.sm,
  transition: `all ${vars.transition.fast}`,
  selectors: {
    "&:hover": {
      background: vars.color.bgSoft,
      color: vars.color.text,
    },
  },
  "@media": {
    "(max-width: 768px)": {
      display: "none",
    },
  },
})

export const searchKbd = style({
  display: "none",
  marginLeft: "4px",
  "@media": {
    "(min-width: 768px)": {
      display: "flex",
      gap: "3px",
    },
  },
})

globalStyle(`${searchKbd} kbd`, {
  padding: "2px 6px",
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: vars.font.family,
})

// Mobile expanded states
globalStyle(`${search}[data-expanded="true"], ${search}:focus-within`, {
  "@media": {
    "(max-width: 768px)": {
      width: "min(360px, calc(100vw - 20px))",
    },
  },
})

globalStyle(
  `${search}[data-expanded="true"] ${searchField}, ${search}:focus-within ${searchField}`,
  {
    "@media": {
      "(max-width: 768px)": {
        width: "100%",
        gap: "8px",
        padding: "8px 12px",
      },
    },
  }
)

globalStyle(
  `${search}[data-expanded="true"] ${searchInput}, ${search}:focus-within ${searchInput}`,
  {
    "@media": {
      "(max-width: 768px)": {
        flex: 1,
        opacity: 1,
        pointerEvents: "auto",
      },
    },
  }
)

globalStyle(
  `${search}[data-expanded="true"] ${searchClear}, ${search}:focus-within ${searchClear}`,
  {
    "@media": {
      "(max-width: 768px)": {
        display: "inline-flex",
      },
    },
  }
)
