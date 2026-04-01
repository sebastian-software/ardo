import { useEffect, useRef, useState } from "react"

import type { TOCItem } from "../config/types"

import { useArdoSiteConfig, useArdoTOC } from "../runtime/hooks"
import * as styles from "./TOC.css"

export interface ArdoTOCProps {
  /** Label for the TOC heading (default: "On this page") */
  label?: string
}

export function ArdoTOC({ label: labelProp }: ArdoTOCProps = {}) {
  const toc = useArdoTOC()
  const siteConfig = useArdoSiteConfig()
  const [activeId, setActiveId] = useState<string>("")
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const isClickScrolling = useRef(false)

  const label = labelProp ?? siteConfig.tocLabel ?? "On this page"

  useEffect(() => {
    scrollContainerRef.current = document.getElementById("main-content")
  }, [])

  useEffect(() => {
    if (toc.length === 0) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const headingElements = toc.map((item) => document.getElementById(item.id)).filter(Boolean)
    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        root: scrollContainer,
        // Shrink the detection zone to a narrow band at the top.
        // The -20px top accounts for scroll-padding, -85% bottom means
        // only headings in the top ~15% of the container trigger activation.
        rootMargin: "-20px 0px -85% 0px",
        threshold: 0,
      }
    )

    for (const element of headingElements) {
      if (element !== null) observer.observe(element)
    }

    return () => {
      for (const element of headingElements) {
        if (element !== null) observer.unobserve(element)
      }
    }
  }, [toc])

  const handleClickItem = (id: string) => {
    setActiveId(id)
    isClickScrolling.current = true
    const element = document.getElementById(id)
    const container = scrollContainerRef.current
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      globalThis.history.pushState(null, "", `#${id}`)
    }
    // Re-enable observer after scroll finishes
    if (container) {
      const onScrollEnd = () => {
        isClickScrolling.current = false
        container.removeEventListener("scrollend", onScrollEnd)
      }
      container.addEventListener("scrollend", onScrollEnd, { once: true })
      // Fallback for browsers without scrollend
      setTimeout(() => {
        isClickScrolling.current = false
      }, 1000)
    } else {
      isClickScrolling.current = false
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <aside className={styles.toc}>
      <div>
        <h3 className={styles.tocTitle}>{label}</h3>
        <nav aria-label="Table of contents">
          <TOCItems items={toc} activeId={activeId} onClickItem={handleClickItem} />
        </nav>
      </div>
    </aside>
  )
}

interface TOCItemsProps {
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

interface TOCItemComponentProps {
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
