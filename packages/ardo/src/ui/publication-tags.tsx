import { type ReactNode, useMemo } from "react"
import type { PublicationTagLabel } from "../publication/types"
import {
  ArdoPublicationTagsContext,
  type ArdoPublicationTagsValue,
  showTagKey,
} from "./publication-tags-context"

/**
 * Provides tag labels and archive links to a generated publication route. Ardo's generated routes
 * render it; the label function is called during rendering, inside the site's render context.
 */
export function ArdoPublicationTags({
  label,
  archive,
  children,
}: {
  label?: PublicationTagLabel
  /** Path prefix of the tag archives, such as `/news/tags/`. */
  archive?: string
  children: ReactNode
}) {
  const value = useMemo<ArdoPublicationTagsValue>(
    () => ({
      label: label ?? showTagKey,
      ...(archive == null ? {} : { path: (key: string) => `${archive}${key}` }),
    }),
    [label, archive]
  )
  return <ArdoPublicationTagsContext value={value}>{children}</ArdoPublicationTagsContext>
}
