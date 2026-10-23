import { createContext } from "react"

import type { ArdoMetaDescriptor } from "./page-context"

/** Everything the HTML shell needs that only the renderer knows. */
export type ArdoDocument = {
  /** Head tags from the page's or the root's `meta` export. */
  meta: ArdoMetaDescriptor[]
  /** Stylesheets the page needs before it paints. */
  stylesheets: string[]
  /** Module chunks the browser can fetch while it parses the page. */
  modulePreloads: string[]
  /** URL of the client entry that hydrates the page. */
  entry?: string
  /** Current locale, or the configured site language. */
  lang?: string
  /** Deployment root containing generated icon files. */
  iconBasePath?: string
} & ArdoDocumentIcons

/** Icon URLs the page passed to `ArdoRoot`, usually imported assets. */
export type ArdoDocumentIcons = {
  icon?: string
  appleTouchIcon?: string
}

export const ArdoDocumentContext = createContext<ArdoDocument | null>(null)

/**
 * The server renders the page before its HTML shell. `ArdoRoot` hands its
 * icons to this collector while the page renders, so the shell can link them
 * in `<head>`. In the browser there is no collector.
 */
export const ArdoDocumentIconsContext = createContext<((icons: ArdoDocumentIcons) => void) | null>(
  null
)
