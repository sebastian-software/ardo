import { useState, useEffect } from "react"
import { useTOC, useThemeConfig } from "../runtime/hooks"
import type { TOCItem } from "../config/types"

export function TOC() {
  const toc = useTOC()
  const themeConfig = useThemeConfig()
  const [activeId, setActiveId] = useState<string>("")

  const label = themeConfig.outline?.label ?? "On this page"

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
    <aside className="ardo-toc">
      <div className="ardo-toc-container">
        <h3 className="ardo-toc-title">{label}</h3>
        <nav className="ardo-toc-nav">
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
    <ul className="ardo-toc-list">
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
    <li className="ardo-toc-item">
      <a
        href={`#${item.id}`}
        className={[
          `ardo-toc-link ardo-toc-link-${item.level}`,
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
            window.history.pushState(null, "", `#${item.id}`)
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
