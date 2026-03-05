import { useEffect, useState } from "react"

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

  const label = labelProp ?? siteConfig.tocLabel ?? "On this page"

  useEffect(() => {
    if (toc.length === 0) return

    const headingElements = toc.map((item) => document.getElementById(item.id)).filter(Boolean)

    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    )

    headingElements.forEach((el) => el && observer.observe(el))

    return () => {
      headingElements.forEach((el) => el && observer.unobserve(el))
    }
  }, [toc])

  if (toc.length === 0) {
    return null
  }

  return (
    <aside className={styles.toc}>
      <div>
        <h3 className={styles.tocTitle}>{label}</h3>
        <nav aria-label="Table of contents">
          <TOCItems items={toc} activeId={activeId} />
        </nav>
      </div>
    </aside>
  )
}

interface TOCItemsProps {
  items: TOCItem[]
  activeId: string
}

function TOCItems({ items, activeId }: TOCItemsProps) {
  return (
    <ul className={styles.tocList}>
      {items.map((item) => (
        <TOCItemComponent key={item.id} item={item} activeId={activeId} />
      ))}
    </ul>
  )
}

interface TOCItemComponentProps {
  item: TOCItem
  activeId: string
}

function TOCItemComponent({ item, activeId }: TOCItemComponentProps) {
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
          const element = document.getElementById(item.id)
          if (element) {
            element.scrollIntoView({ behavior: "smooth" })
            globalThis.history.pushState(null, "", `#${item.id}`)
          }
        }}
      >
        {item.text}
      </a>
      {item.children && item.children.length > 0 && (
        <TOCItems items={item.children} activeId={activeId} />
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
