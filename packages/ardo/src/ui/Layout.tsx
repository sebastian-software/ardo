import { type ReactNode } from "react"

// =============================================================================
// Layout Component
// =============================================================================

export interface LayoutProps {
  /** Header content */
  header?: ReactNode
  /** Sidebar content */
  sidebar?: ReactNode
  /** Footer content */
  footer?: ReactNode
  /** Main content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Layout component with explicit slot props.
 *
 * @example
 * ```tsx
 * <Layout
 *   header={<Header logo="/logo.svg" title="Ardo" nav={...} />}
 *   sidebar={<Sidebar>...</Sidebar>}
 *   footer={<Footer message="MIT License" />}
 * >
 *   <Outlet />
 * </Layout>
 * ```
 */
export function Layout({ header, sidebar, footer, children, className }: LayoutProps) {
  return (
    <div className={className ?? "ardo-layout"}>
      {header}
      <div className="ardo-layout-container">
        {sidebar}
        <main className="ardo-main">{children}</main>
      </div>
      {footer}
    </div>
  )
}
