import { createContext, use } from "react"
import type { PublicationTagLabel } from "../publication/types"

/** How the current publication route shows tags. */
export type ArdoPublicationTagsValue = {
  /** The display label of a tag key: the site's `tagLabel`, or the key itself. */
  label: PublicationTagLabel
  /** The archive path of a tag key; undefined unless `tags: true` generates archives. */
  path?: (key: string) => string
}

export const showTagKey: PublicationTagLabel = (key) => key

export const ArdoPublicationTagsContext = createContext<ArdoPublicationTagsValue>({
  label: showTagKey,
})

/** Tag labels and archive paths of the current publication route, for site components. */
export function useArdoPublicationTags(): ArdoPublicationTagsValue {
  return use(ArdoPublicationTagsContext)
}
