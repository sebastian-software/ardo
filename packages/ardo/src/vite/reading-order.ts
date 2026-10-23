import type { RouteManifestEntry } from "./route-manifest"

import { compareSectionIds } from "../ui/section-kinds"

type ReadingOrderPage = Pick<RouteManifestEntry, "metadata" | "routePath" | "sourceLocaleId">

/** A page in reading order, with its locale folder and top-level section folder. */
export type ReadingOrderEntry<T extends ReadingOrderPage> = {
  entry: T
  localeId?: string
  section?: string
}

type ReadingNode<T> = {
  children: Map<string, ReadingNode<T>>
  name: string
  page?: T
}

/**
 * Orders pages the way the generated sidebar shows them. Locales keep their
 * configured order. Each locale starts with its home page and top-level pages,
 * then its section folders in tab order. Inside a folder, the folder's own page
 * comes first, then its children by frontmatter `order`, then by title.
 */
export function sortByReadingOrder<T extends ReadingOrderPage>(
  entries: readonly T[],
  options: { localeIds?: readonly string[]; sectionOrder?: readonly string[] } = {}
): Array<ReadingOrderEntry<T>> {
  const localeRank = (localeId: string | undefined) =>
    localeId == null ? -1 : (options.localeIds?.indexOf(localeId) ?? -1)
  const compareSections = compareSectionIds(options.sectionOrder)
  const ordered: Array<ReadingOrderEntry<T>> = []
  // Sort the pairs, not the keys: Array#sort moves undefined keys to the end unseen.
  const locales = [...buildTrees(entries)].sort(
    ([left], [right]) => localeRank(left) - localeRank(right)
  )
  for (const [localeId, root] of locales) {
    const children = [...root.children.values()]
    const locale = localeId == null ? {} : { localeId }
    if (root.page != null) ordered.push({ entry: root.page, ...locale })
    for (const page of children.filter((node) => node.children.size === 0).sort(comparePages))
      appendNode(ordered, page, locale)
    for (const section of children
      .filter((node) => node.children.size > 0)
      .sort((left, right) => compareSections(left.name, right.name)))
      appendNode(ordered, section, { ...locale, section: section.name })
  }
  return ordered
}

/** One route tree per locale folder, keyed by route segment. */
function buildTrees<T extends ReadingOrderPage>(
  entries: readonly T[]
): Map<string | undefined, ReadingNode<T>> {
  const roots = new Map<string | undefined, ReadingNode<T>>()
  for (const entry of entries) {
    const root = roots.get(entry.sourceLocaleId) ?? createNode<T>("")
    roots.set(entry.sourceLocaleId, root)
    let node = root
    for (const segment of entry.routePath.split("/").filter(Boolean)) {
      const child = node.children.get(segment) ?? createNode<T>(segment)
      node.children.set(segment, child)
      node = child
    }
    node.page = entry
  }
  return roots
}

function createNode<T>(name: string): ReadingNode<T> {
  return { children: new Map(), name }
}

function appendNode<T extends ReadingOrderPage>(
  ordered: Array<ReadingOrderEntry<T>>,
  node: ReadingNode<T>,
  context: Omit<ReadingOrderEntry<T>, "entry">
): void {
  if (node.page != null) ordered.push({ entry: node.page, ...context })
  for (const child of [...node.children.values()].sort(comparePages))
    appendNode(ordered, child, context)
}

/** Same rule as the sidebar: pages with `order` first, ascending, then by title. */
function comparePages<T extends ReadingOrderPage>(
  left: ReadingNode<T>,
  right: ReadingNode<T>
): number {
  const leftOrder = left.page?.metadata.order
  const rightOrder = right.page?.metadata.order
  if (leftOrder != null && rightOrder == null) return -1
  if (leftOrder == null && rightOrder != null) return 1
  return (leftOrder ?? 0) - (rightOrder ?? 0) || nodeTitle(left).localeCompare(nodeTitle(right))
}

function nodeTitle<T extends ReadingOrderPage>(node: ReadingNode<T>): string {
  return (
    node.page?.metadata.title ??
    node.name.replaceAll(/[_-]/g, " ").replaceAll(/\b\w/g, (char) => char.toUpperCase())
  )
}
