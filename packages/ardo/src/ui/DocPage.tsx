import type { ReactNode } from "react"

import { useArdoConfig, useArdoPageData, useArdoSiteConfig } from "../runtime/hooks"
import { ChromeIcon } from "./chrome-icons"
import { ArdoContent, type ArdoContentProps } from "./Content"
import * as styles from "./DocPage.css"
import { ArdoLayout } from "./Layout"
import { ArdoTOC } from "./Toc"

// =============================================================================
// DocPage Component (includes Layout - for backwards compatibility)
// =============================================================================

export type ArdoDocPageProps = ArdoDocContentProps

/**
 * A documentation page with Ardo's layout around it: header, sidebar, article,
 * outline, and footer. `ArdoRoot` renders the same for every page; use this
 * only in a custom root.
 *
 * @example
 * ```tsx
 * <ArdoDocPage>
 *   <ArdoOutlet />
 * </ArdoDocPage>
 * ```
 */
export function ArdoDocPage(props: ArdoDocPageProps) {
  return (
    <ArdoLayout>
      <ArdoDocContent {...props} />
    </ArdoLayout>
  )
}

// =============================================================================
// DocContent Component (without Layout - for use with _layout.tsx)
// =============================================================================

export type ArdoDocContentProps = Omit<ArdoContentProps, "metaPlacement"> & {
  /** TOC label (forwarded to TOC). */
  tocLabel?: string
  /** Outline source. DOM mode includes component-rendered headings after hydration. */
  tocSource?: "metadata" | "dom"
  /** Replace the right-hand page rail; false omits it. Undefined keeps the default. */
  rail?: ReactNode
}

/**
 * The article, outline, and page actions of a documentation page, without the
 * surrounding layout. Use it inside `ArdoLayout` in a custom root.
 *
 * @example
 * ```tsx
 * <ArdoLayout header={<ArdoHeader />} sidebar={<ArdoSidebar />}>
 *   <ArdoDocContent>
 *     <ArdoOutlet />
 *   </ArdoDocContent>
 * </ArdoLayout>
 * ```
 */
export function ArdoDocContent({
  children,
  editLink,
  lastUpdated,
  tocLabel,
  tocSource,
  header,
  footer,
  outline,
  rail,
}: ArdoDocContentProps) {
  const pageData = useArdoPageData()
  const hideToc = pageData?.frontmatter.outline === false

  return (
    <div
      className={`ardo-doc-page ${styles.docPage}`}
      data-rail={rail === false || rail === null ? "false" : undefined}
    >
      <ArdoContent
        editLink={editLink}
        lastUpdated={lastUpdated}
        metaPlacement="footer-on-narrow"
        header={header}
        footer={footer}
        outline={
          outline === undefined ? (
            hideToc ? undefined : (
              <ArdoTOC label={tocLabel} source={tocSource} collapsible />
            )
          ) : (
            outline
          )
        }
      >
        {children}
      </ArdoContent>
      {rail === undefined ? (
        <ArdoPageRail
          editLink={editLink}
          lastUpdated={lastUpdated}
          tocLabel={tocLabel}
          hideToc={hideToc}
          tocSource={tocSource}
        />
      ) : (
        rail
      )}
    </div>
  )
}

function ArdoPageRail({
  editLink,
  lastUpdated,
  tocLabel,
  hideToc = false,
  tocSource,
}: {
  editLink?: { pattern: string; text?: string }
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
  tocLabel?: string
  hideToc?: boolean
  tocSource?: "metadata" | "dom"
}) {
  const siteConfig = useArdoSiteConfig()
  const locale = useArdoConfig().lang ?? "en"
  const pageData = useArdoPageData()
  const edit = resolveRailEditLink({ pageData, editLink, siteConfig })
  const updated = resolveRailLastUpdated({ pageData, lastUpdated, siteConfig, locale })
  const hasMeta = edit.show || updated.show

  if (!hasMeta && hideToc) return null

  return (
    <aside className={`ardo-page-rail ${styles.pageRail}`}>
      {hasMeta && (
        <section className={`ardo-page-rail-section ${styles.pageRailSection}`}>
          <h2 className={styles.pageRailTitle}>Page</h2>
          {edit.show && (
            <a
              href={edit.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pageRailLink}
            >
              <ChromeIcon name="edit" />
              {edit.text}
              <ChromeIcon name="external-link" size={12} />
            </a>
          )}
          {updated.show && (
            <p className={styles.pageRailText}>
              <ChromeIcon name="last-updated" />
              {updated.label}: {updated.text}
            </p>
          )}
        </section>
      )}
      {!hideToc && (
        <section className={`ardo-page-rail-section ${styles.pageRailSection}`}>
          <ArdoTOC label={tocLabel} source={tocSource} />
        </section>
      )}
    </aside>
  )
}

type RailMetaInput = {
  pageData: ReturnType<typeof useArdoPageData>
  siteConfig: ReturnType<typeof useArdoSiteConfig>
  locale?: string
}

function resolveRailEditLink({
  pageData,
  editLink,
  siteConfig,
}: { editLink?: { pattern: string; text?: string } } & RailMetaInput) {
  const resolved = editLink ?? siteConfig.editLink
  const pattern = resolved?.pattern ?? ""
  const relativePath = pageData?.relativePath ?? ""
  const show = pageData?.frontmatter.editLink !== false && pattern !== "" && relativePath !== ""
  return {
    href: show
      ? pattern.replace(
          ":path",
          relativePath
            .split("/")
            .map((part) => encodeURIComponent(part))
            .join("/")
        )
      : undefined,
    text: resolved?.text ?? "Edit this page",
    show,
  }
}

function resolveRailLastUpdated({
  pageData,
  lastUpdated,
  siteConfig,
  locale = "en",
}: {
  lastUpdated?: { enabled?: boolean; text?: string; formatOptions?: Intl.DateTimeFormatOptions }
} & RailMetaInput) {
  const resolved = lastUpdated ?? siteConfig.lastUpdated
  const value = pageData?.lastUpdated
  const show =
    pageData?.frontmatter.lastUpdated !== false &&
    resolved?.enabled === true &&
    typeof value === "number" &&
    Number.isFinite(value)
  const formatOptions = {
    timeZone: "UTC",
    ...(resolved?.formatOptions ?? {
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
    }),
  }
  return {
    label: resolved?.text ?? "Last updated",
    text: show ? new Date(value).toLocaleDateString(locale, formatOptions) : undefined,
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
