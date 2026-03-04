import { type ReactNode } from "react"
import { useArdoPageData } from "../runtime/hooks"
import { ArdoLayout } from "./Layout"
import { ArdoContent } from "./Content"
import { ArdoTOC } from "./TOC"
import * as styles from "./DocPage.css"

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
export function ArdoDocPage({ children }: DocPageProps) {
  const pageData = useArdoPageData()
  const showToc =
    pageData?.frontmatter.outline !== false && pageData?.toc && pageData.toc.length > 0

  return (
    <ArdoLayout>
      <div className={styles.docPage}>
        <ArdoContent>{children}</ArdoContent>
        {showToc && <ArdoTOC />}
      </div>
    </ArdoLayout>
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
export function ArdoDocContent({ children }: DocContentProps) {
  const pageData = useArdoPageData()
  const showToc =
    pageData?.frontmatter.outline !== false && pageData?.toc && pageData.toc.length > 0

  return (
    <div className={styles.docPage}>
      <ArdoContent>{children}</ArdoContent>
      {showToc && <ArdoTOC />}
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
export function ArdoDocLayout({ content }: DocLayoutProps) {
  return <ArdoDocPage>{content}</ArdoDocPage>
}
