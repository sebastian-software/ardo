import type { ReactNode } from "react"

import { useArdoConfig, useArdoPageData, useArdoSiteConfig } from "../runtime/hooks"
import { ArdoContent } from "./Content"
import * as styles from "./DocPage.css"
import { ArdoLayout } from "./Layout"
import { ArdoTOC } from "./Toc"

// =============================================================================
// DocPage Component (includes Layout - for backwards compatibility)
// =============================================================================

type DocPageProps = {
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
        <ArdoContent editLink={editLink} lastUpdated={lastUpdated} metaPlacement="none">
          {children}
        </ArdoContent>
        <ArdoPageRail
          editLink={editLink}
          lastUpdated={lastUpdated}
          tocLabel={tocLabel}
          hideToc={hideToc}
        />
      </div>
    </ArdoLayout>
  )
}

// =============================================================================
// DocContent Component (without Layout - for use with _layout.tsx)
// =============================================================================

type DocContentProps = {
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
      <ArdoContent editLink={editLink} lastUpdated={lastUpdated} metaPlacement="none">
        {children}
      </ArdoContent>
      <ArdoPageRail
        editLink={editLink}
        lastUpdated={lastUpdated}
        tocLabel={tocLabel}
        hideToc={hideToc}
      />
    </div>
  )
}

function ArdoPageRail({
  editLink,
  lastUpdated,
  tocLabel,
  hideToc = false,
}: {
  editLink?: { pattern: string; text?: string }
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  tocLabel?: string
  hideToc?: boolean
}) {
  const config = useArdoConfig()
  const siteConfig = useArdoSiteConfig()
  const pageData = useArdoPageData()
  const version = config.project?.version ?? ""
  const edit = resolveRailEditLink({ pageData, editLink, siteConfig })
  const updated = resolveRailLastUpdated({ pageData, lastUpdated, siteConfig })
  const hasMeta = edit.show || updated.show
  const hasVersion = version !== ""

  if (!hasVersion && !hasMeta && hideToc) return null

  return (
    <aside className={styles.pageRail}>
      {hasVersion && (
        <section className={styles.pageRailSection}>
          <h2 className={styles.pageRailTitle}>Version</h2>
          <select className={styles.pageRailSelect} defaultValue={version} aria-label="Version">
            <option value={version}>{version}</option>
          </select>
        </section>
      )}
      {hasMeta && (
        <section className={styles.pageRailSection}>
          <h2 className={styles.pageRailTitle}>Page</h2>
          {edit.show && (
            <a
              href={edit.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pageRailLink}
            >
              {edit.text}
            </a>
          )}
          {updated.show && (
            <p className={styles.pageRailText}>
              {updated.label}: {updated.text}
            </p>
          )}
        </section>
      )}
      {!hideToc && (
        <section className={styles.pageRailSection}>
          <ArdoTOC label={tocLabel} />
        </section>
      )}
    </aside>
  )
}

type RailMetaInput = {
  pageData: ReturnType<typeof useArdoPageData>
  siteConfig: ReturnType<typeof useArdoSiteConfig>
}

function resolveRailEditLink({
  pageData,
  editLink,
  siteConfig,
}: { editLink?: { pattern: string; text?: string } } & RailMetaInput) {
  const resolved = editLink ?? siteConfig.editLink
  const pattern = resolved?.pattern ?? ""
  const relativePath = pageData?.relativePath ?? ""
  const show = pageData?.frontmatter.editLink !== false && pattern !== "" && pageData !== undefined
  return {
    href: show ? pattern.replace(":path", relativePath) : undefined,
    text: resolved?.text ?? "Edit this page",
    show,
  }
}

function resolveRailLastUpdated({
  pageData,
  lastUpdated,
  siteConfig,
}: {
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
} & RailMetaInput) {
  const resolved = lastUpdated ?? siteConfig.lastUpdated
  const value = pageData?.lastUpdated
  const show =
    pageData?.frontmatter.lastUpdated !== false &&
    resolved?.enabled === true &&
    typeof value === "number"
  const formatOptions = resolved?.formatOptions ?? {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  }
  return {
    label: resolved?.text ?? "Last updated",
    text: show ? new Date(value).toLocaleDateString(undefined, formatOptions) : undefined,
    show,
  }
}

// =============================================================================
// DocLayout Component (legacy alias)
// =============================================================================

type DocLayoutProps = {
  content: ReactNode
}

/**
 * @deprecated Use DocPage or DocContent instead
 */
export function ArdoDocLayout({ content }: DocLayoutProps) {
  return <ArdoDocPage>{content}</ArdoDocPage>
}
