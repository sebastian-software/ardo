import type { ArdoLayoutVariant } from "./layout-context"

/**
 * How the header shows search.
 *
 * - `"auto"` lets the page layout decide: docs pages get the field, bare
 *   (marketing) pages get the icon button.
 * - `"field"` shows the search input on desktop.
 * - `"icon"` shows an icon button at every width.
 *
 * ⌘K / Ctrl+K opens search in every mode.
 */
export type ArdoHeaderSearchMode = "auto" | "field" | "icon"

/** Resolves the `search` prop against the page layout. */
export function resolveHeaderSearch(
  search: ArdoHeaderSearchMode | boolean,
  layout: ArdoLayoutVariant
): "field" | "icon" | "none" {
  if (search === false) return "none"
  if (search === "field" || search === "icon") return search
  return layout === "bare" ? "icon" : "field"
}
