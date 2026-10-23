import { useEffect, useState } from "react"

import type { TOCItem } from "../config/types"
import { buildToc } from "../markdown/toc"
import { useArdoConfig } from "../runtime/hooks"
import { useArdoPath } from "../runtime/page-context"

/** Preserve authored anchors and give otherwise unaddressable headings a unique ID. */
function ensureHeadingId(heading: HTMLElement, index: number): string {
  if (heading.id !== "") return heading.id
  let sequence = index + 1
  while (document.getElementById(`ardo-heading-${sequence}`) != null) sequence++
  heading.id = `ardo-heading-${sequence}`
  return heading.id
}

function readHeading(heading: HTMLElement, index: number, levels: [number, number]) {
  const level = Number(heading.tagName.slice(1))
  if (level < levels[0] || level > levels[1]) return null
  if (
    heading.closest(
      'nav, .ardo-toc, .ardo-page-outline, [hidden], [aria-hidden="true"], [data-ardo-toc="exclude"]'
    )
  )
    return null
  const copy = heading.cloneNode(true)
  if (!(copy instanceof HTMLElement)) return null
  for (const decoration of copy.querySelectorAll('[aria-hidden="true"]')) decoration.remove()
  const text = copy.textContent?.replaceAll(/\s+/gu, " ").trim() ?? ""
  if (text === "") return null
  return { id: ensureHeadingId(heading, index), text, level, start: 0, end: 0 }
}

/** Read actual article headings, including headings rendered by React components. */
export function readDomToc(root: Element, levels: [number, number]): TOCItem[] {
  const headings = []
  const seen = new Set<string>()
  for (const [index, heading] of root
    .querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6")
    .entries()) {
    const item = readHeading(heading, index, levels)
    if (item == null || seen.has(item.id)) continue
    seen.add(item.id)
    headings.push(item)
  }
  return buildToc(headings, levels)
}

/** Keep SSR metadata for hydration, then follow the mounted article in DOM mode. */
export function useDomToc(
  metadata: TOCItem[],
  { source, scope }: { source: "metadata" | "dom"; scope?: string }
): TOCItem[] {
  const config = useArdoConfig()
  const path = useArdoPath()
  const levels = config.markdown?.toc?.level ?? [2, 3]
  const key = JSON.stringify([path, scope, levels])
  const [live, setLive] = useState<{ key: string; items: TOCItem[] }>()
  const [minLevel, maxLevel] = levels
  useEffect(() => {
    if (source !== "dom") return
    const root =
      scope === undefined
        ? (document.querySelector("#main-content .ardo-content-body") ??
          document.getElementById("main-content"))
        : document.querySelector(scope)
    if (root == null) return
    const update = () => {
      const items = readDomToc(root, [minLevel, maxLevel])
      setLive((previous) =>
        previous?.key === key && JSON.stringify(previous.items) === JSON.stringify(items)
          ? previous
          : { key, items }
      )
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["id", "hidden", "aria-hidden", "data-ardo-toc"],
    })
    return () => observer.disconnect()
  }, [key, source, scope, minLevel, maxLevel])
  return source === "dom" && live?.key === key ? live.items : metadata
}
