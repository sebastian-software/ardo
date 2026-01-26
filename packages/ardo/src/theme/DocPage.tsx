import { type ReactNode } from 'react'
import { usePageData } from '../runtime/hooks'
import { Layout } from './Layout'
import { Content } from './Content'
import { TOC } from './TOC'

// =============================================================================
// DocPage Component (includes Layout - for backwards compatibility)
// =============================================================================

interface DocPageProps {
  children: ReactNode
}

/**
 * Full documentation page with Layout wrapper.
 * Use this when you don't have a _layout.tsx file.
 *
 * @example
 * ```tsx
 * <DocPage>
 *   <Content />
 * </DocPage>
 * ```
 */
export function DocPage({ children }: DocPageProps) {
  const pageData = usePageData()
  const showToc =
    pageData?.frontmatter.outline !== false && pageData?.toc && pageData.toc.length > 0

  return (
    <Layout>
      <div className="press-doc-page">
        <Content>{children}</Content>
        {showToc && <TOC />}
      </div>
    </Layout>
  )
}

// =============================================================================
// DocContent Component (without Layout - for use with _layout.tsx)
// =============================================================================

interface DocContentProps {
  children: ReactNode
}

/**
 * Documentation content without Layout wrapper.
 * Use this when you have a _layout.tsx that provides the Layout.
 *
 * @example
 * ```tsx
 * // In _layout.tsx:
 * <Layout>
 *   <Header ... />
 *   <Sidebar ... />
 *   <Outlet />
 *   <Footer ... />
 * </Layout>
 *
 * // In page routes:
 * <DocContent>
 *   <MarkdownContent />
 * </DocContent>
 * ```
 */
export function DocContent({ children }: DocContentProps) {
  const pageData = usePageData()
  const showToc =
    pageData?.frontmatter.outline !== false && pageData?.toc && pageData.toc.length > 0

  return (
    <div className="press-doc-page">
      <Content>{children}</Content>
      {showToc && <TOC />}
    </div>
  )
}

// =============================================================================
// DocLayout Component (legacy alias)
// =============================================================================

interface DocLayoutProps {
  content: ReactNode
}

/**
 * @deprecated Use DocPage or DocContent instead
 */
export function DocLayout({ content }: DocLayoutProps) {
  return <DocPage>{content}</DocPage>
}
