import type { Publication } from "../publication/types"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import type { ViewName } from "./publication-options"

/**
 * Run a site's metadata function for one route. Its result replaces Ardo's metadata, so it must
 * be a complete list of serializable descriptors; failures name the option and the route.
 */
export function runSiteMeta(
  view: ViewName,
  route: string,
  create: () => unknown
): ArdoMetaDescriptor[] {
  let value: unknown
  try {
    value = create()
  } catch (error) {
    throw new Error(
      `[ardo] publication.meta.${view} failed for ${route}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    )
  }
  if (
    !Array.isArray(value) ||
    value.some((entry) => entry == null || typeof entry !== "object" || Array.isArray(entry))
  )
    throw new Error(
      `[ardo] publication.meta.${view} must synchronously return an array of meta descriptors (${route}).`
    )
  // The routes embed the descriptors as data, so apply JSON semantics: undefined attributes vanish.
  // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone keeps undefined and Date values
  return JSON.parse(JSON.stringify(value)) as ArdoMetaDescriptor[]
}

/** A deeply frozen copy, so metadata functions cannot change the data that pages receive. */
export function frozenCopy(publication: Publication): Publication {
  return deepFreeze(structuredClone(publication))
}

function deepFreeze<T>(value: T): T {
  if (value != null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
