import { createContext } from "react"

/** Page-scoped, server-only appearance collected from the rendered JSX. */
export type ArdoAppearance = { logo?: string; themeCss?: string }
export const ArdoAppearanceContext = /* @__PURE__ */ createContext<
  ((value: ArdoAppearance) => void) | null
>(null)
