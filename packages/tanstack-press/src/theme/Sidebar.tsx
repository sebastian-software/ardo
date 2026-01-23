import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useSidebar } from '../runtime/hooks'
import type { SidebarItem } from '../config/types'

export function Sidebar() {
  const sidebar = useSidebar()

  return (
    <aside className="press-sidebar">
      <nav className="press-sidebar-nav">
        <SidebarItems items={sidebar} depth={0} />
      </nav>
    </aside>
  )
}

interface SidebarItemsProps {
  items: SidebarItem[]
  depth: number
}

function SidebarItems({ items, depth }: SidebarItemsProps) {
  return (
    <ul className={`press-sidebar-list press-sidebar-list-${depth}`}>
      {items.map((item, index) => (
        <SidebarItemComponent key={index} item={item} depth={depth} />
      ))}
    </ul>
  )
}

interface SidebarItemComponentProps {
  item: SidebarItem
  depth: number
}

function SidebarItemComponent({ item, depth }: SidebarItemComponentProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [collapsed, setCollapsed] = useState(item.collapsed ?? false)

  const hasChildren = item.items && item.items.length > 0

  const isChildActive =
    hasChildren &&
    item.items!.some(
      (child) =>
        child.link === pathname ||
        (child.items && child.items.some((grandchild) => grandchild.link === pathname))
    )

  // Build className without extra whitespace
  const linkClassName = ['press-sidebar-link', isChildActive && 'child-active']
    .filter(Boolean)
    .join(' ')

  const textClassName = ['press-sidebar-text', isChildActive && 'child-active']
    .filter(Boolean)
    .join(' ')

  return (
    <li className="press-sidebar-item">
      <div className="press-sidebar-item-header">
        {item.link ? (
          <Link to={item.link} className={linkClassName} activeProps={{ className: 'active' }}>
            {item.text}
          </Link>
        ) : (
          <span className={textClassName} onClick={() => hasChildren && setCollapsed(!collapsed)}>
            {item.text}
          </span>
        )}

        {hasChildren && (
          <button
            className={['press-sidebar-collapse', collapsed && 'collapsed']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && !collapsed && <SidebarItems items={item.items!} depth={depth + 1} />}
    </li>
  )
}
