import { createContext, type ElementType } from "react"

/** Additions and replacements for Ardo's default Markdown component set. */
export type ArdoMDXComponents = Record<string, ElementType>

export const ArdoMDXComponentsContext = createContext<ArdoMDXComponents>({})
