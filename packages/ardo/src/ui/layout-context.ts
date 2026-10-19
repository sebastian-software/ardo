import { createContext, use } from "react"

/** Which shell a page renders in: the docs shell or a bare marketing page. */
export type ArdoLayoutVariant = "bare" | "doc"

export const ArdoLayoutVariantContext = createContext<ArdoLayoutVariant>("doc")

export function useArdoLayoutVariant(): ArdoLayoutVariant {
  return use(ArdoLayoutVariantContext)
}
