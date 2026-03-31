import type { ReactNode } from "react"

import { useArdoPageData } from "../runtime/hooks"
import { ArdoContent } from "./Content"
import * as styles from "./DocPage.css"
import { ArdoLayout } from "./Layout"
import { ArdoTOC } from "./TOC"

// =============================================================================
// DocPage Component (includes Layout - for backwards compatibility)
// =============================================================================

interface DocPageProps {
  children: ReactNode
  /** Edit link configuration (forwarded to Content) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (forwarded to Content) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  /** TOC label (forwarded to TOC) */
  tocLabel?: string
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
export function ArdoDocPage({ children, editLink, lastUpdated, tocLabel }: DocPageProps) {
  const pageData = useArdoPageData()
  const hideToc = pageData?.frontmatter.outline === false

  return (
    <ArdoLayout>
      <div className={styles.docPage}>
        <ArdoContent editLink={editLink} lastUpdated={lastUpdated}>
          {children}
        </ArdoContent>
        {!hideToc && <ArdoTOC label={tocLabel} />}
      </div>
    </ArdoLayout>
  )
}

// =============================================================================
// DocContent Component (without Layout - for use with _layout.tsx)
// =============================================================================

interface DocContentProps {
  children: ReactNode
  /** Edit link configuration (forwarded to Content) */
  editLink?: { pattern: string; text?: string }
  /** Last updated configuration (forwarded to Content) */
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  /** TOC label (forwarded to TOC) */
  tocLabel?: string
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
export function ArdoDocContent({ children, editLink, lastUpdated, tocLabel }: DocContentProps) {
  const pageData = useArdoPageData()
  const hideToc = pageData?.frontmatter.outline === false

  return (
    <div className={styles.docPage}>
      <ArdoContent editLink={editLink} lastUpdated={lastUpdated}>
        {children}
      </ArdoContent>
      {!hideToc && <ArdoTOC label={tocLabel} />}
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
