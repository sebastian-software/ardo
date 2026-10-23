import type { ReactNode } from "react"

import { SectionIcon } from "./section-icons"
import { resolveSectionKind } from "./section-kinds"

/** The tab icon for a known section, or `undefined` for anything else. */
export function resolveSectionIcon(sectionId: string): ReactNode {
  const match = resolveSectionKind(sectionId)
  if (match == null) return undefined
  return <SectionIcon kind={match.kind} />
}
