import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import type { TOCItem } from "../config/types"

import { flattenToc } from "../markdown/toc"

import { useArdoLabels, useArdoSiteConfig, useArdoTOC } from "../runtime/hooks"
import * as styles from "./Toc.css"
import { resolveTocScrollRegion, scrollToHeading } from "./toc-navigation"

export type ArdoTOCProps = {
  /** Label for the TOC heading (default: "On this page") */
  label?: string
  /** Use a native disclosure for the compact outline above an article. */
  collapsible?: boolean
}

function readScrollRegionSnapshot() {
  const { root, height } = resolveTocScrollRegion()
  return `${root == null ? "viewport" : "main"}:${height}`
}

function serverScrollRegionSnapshot() {
  return ""
}

function subscribeToScrollRegion(onChange: () => void) {
  globalThis.addEventListener("resize", onChange)
  return () => {
    globalThis.removeEventListener("resize", onChange)
  }
}

export function ArdoTOC({ label: labelProp, collapsible = false }: ArdoTOCProps = {}) {
  const toc = useArdoTOC()
  const siteConfig = useArdoSiteConfig()
  const labels = useArdoLabels()
  const [activeId, setActiveId] = useState<string>("")
  const scrollSnapshot = useSyncExternalStore(
    subscribeToScrollRegion,
    readScrollRegionSnapshot,
    serverScrollRegionSnapshot
  )
  const isClickScrollingRef = useRef(false)

  const label = labelProp ?? siteConfig.tocLabel ?? labels.toc.label

  useEffect(() => {
    if (
      toc.length === 0 ||
      scrollSnapshot === "" ||
      typeof globalThis.IntersectionObserver !== "function"
    )
      return

    const scrollRegion = resolveTocScrollRegion()

    const headingElements = flattenToc(toc)
      .map((item) => document.getElementById(item.id))
      .filter(Boolean)
    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        root: scrollRegion.root,
        // Percentage root margins resolve against width, including the vertical
        // ones. Pixels keep a nonempty detection band on wide, short viewports.
        rootMargin: `-20px 0px -${Math.round(scrollRegion.height * 0.85)}px 0px`,
        threshold: 0,
      }
    )

    for (const element of headingElements) {
      if (element !== null) observer.observe(element)
    }
    return () => {
      observer.disconnect()
    }
  }, [toc, scrollSnapshot])

  const handleClickItem = (id: string) => {
    setActiveId(id)
    isClickScrollingRef.current = true
    const container = scrollToHeading(id)
    // Re-enable observer after scroll finishes
    const onScrollEnd = () => {
      isClickScrollingRef.current = false
      container.removeEventListener("scrollend", onScrollEnd)
    }
    container.addEventListener("scrollend", onScrollEnd, { once: true })
    // Fallback for browsers without scrollend
    setTimeout(onScrollEnd, 1000)
  }

  if (toc.length === 0) {
    return null
  }

  if (collapsible) {
    return (
      <CompactTOC
        label={label}
        navLabel={labels.toc.navLabel}
        items={toc}
        activeId={activeId}
        onClickItem={handleClickItem}
      />
    )
  }

  return (
    <aside className={`ardo-toc ${styles.toc}`}>
      <div>
        <h3 className={styles.tocTitle}>{label}</h3>
        <nav aria-label={labels.toc.navLabel}>
          <TOCItems items={toc} activeId={activeId} onClickItem={handleClickItem} />
        </nav>
      </div>
    </aside>
  )
}

function CompactTOC({
  label,
  navLabel,
  ...items
}: TOCItemsProps & { label: string; navLabel: string }) {
  return (
    <details className={`ardo-page-outline ${styles.compactToc}`}>
      <summary className={styles.compactSummary}>{label}</summary>
      <nav aria-label={navLabel} className={styles.compactNav}>
        <TOCItems {...items} />
      </nav>
    </details>
  )
}

type TOCItemsProps = {
  items: TOCItem[]
  activeId: string
  onClickItem: (id: string) => void
}

function TOCItems({ items, activeId, onClickItem }: TOCItemsProps) {
  return (
    <ul className={styles.tocList}>
      {items.map((item) => (
        <TOCItemComponent key={item.id} item={item} activeId={activeId} onClickItem={onClickItem} />
      ))}
    </ul>
  )
}

type TOCItemComponentProps = {
  item: TOCItem
  activeId: string
  onClickItem: (id: string) => void
}

function TOCItemComponent({ item, activeId, onClickItem }: TOCItemComponentProps) {
  const isActive = item.id === activeId
  const hasActiveChild = hasActiveDescendant(item, activeId)

  return (
    <li>
      <a
        href={`#${item.id}`}
        aria-current={isActive ? "location" : undefined}
        className={[
          styles.tocLink,
          item.level === 3 && styles.tocLink3,
          item.level === 4 && styles.tocLink4,
          isActive && "active",
          hasActiveChild && "child-active",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => {
          if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
          )
            return
          e.preventDefault()
          onClickItem(item.id)
        }}
      >
        {item.text}
      </a>
      {item.children && item.children.length > 0 && (
        <TOCItems items={item.children} activeId={activeId} onClickItem={onClickItem} />
      )}
    </li>
  )
}

function hasActiveDescendant(item: TOCItem, activeId: string): boolean {
  if (!item.children) return false

  for (const child of item.children) {
    if (child.id === activeId) return true
    if (hasActiveDescendant(child, activeId)) return true
  }

  return false
}
