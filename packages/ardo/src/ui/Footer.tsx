import React, { type ReactNode } from "react"

import type { ProjectMeta, SponsorConfig } from "../config/types"

import { useArdoConfig, useArdoLabels } from "../runtime/hooks"
import { joinClassNames } from "./classnames"
import * as styles from "./Footer.css"
import { ArdoOwlMark } from "./OwlMark"

// =============================================================================
// Footer Component
// =============================================================================

export type ArdoFooterProps = {
  /** Footer message rendered as React content. Strings are escaped. */
  message?: ReactNode
  /** Trusted footer message HTML. Use only for markup you fully control. */
  trustedMessageHtml?: string
  /** Copyright text rendered as React content. Strings are escaped. */
  copyright?: ReactNode
  /** Trusted copyright HTML. Use only for markup you fully control. */
  trustedCopyrightHtml?: string
  /** Custom content (overrides all automatic rendering) */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Project metadata — renders linked "name vX.Y.Z" */
  project?: ProjectMeta
  /** Sponsor link — renders "Sponsored by X" */
  sponsor?: SponsorConfig
  /** Build timestamp (ISO string) — renders formatted date */
  buildTime?: string
  /** Git commit hash — rendered next to the build date */
  buildHash?: string
  /** Show "Built with Ardo" link (default: true) */
  ardoLink?: boolean
}

function formatBuildTime(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Footer component with structured layout for project info, sponsor, and build metadata.
 *
 * Automatically pulls data from Ardo context (`config.project`, `config.buildTime`,
 * `config.buildHash`). Props serve as overrides.
 *
 * When `children` is provided, all automatic rendering is skipped.
 *
 * @example Automatic (zero-config)
 * ```tsx
 * <Footer />
 * ```
 *
 * @example With overrides
 * ```tsx
 * <Footer
 *   sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
 *   message="Released under the MIT License."
 *   copyright="Copyright 2026 Sebastian Software GmbH"
 * />
 * ```
 *
 * @example Trusted HTML opt-in
 * ```tsx
 * <Footer trustedMessageHtml={'Released under the <a href="/license">MIT License</a>.'} />
 * ```
 *
 * @example Custom content
 * ```tsx
 * <Footer>
 *   <CustomFooterContent />
 * </Footer>
 * ```
 */
function FooterProjectLink({
  project,
  config,
}: {
  project: ArdoFooterProps["project"]
  config: ReturnType<typeof useArdoConfig>
}) {
  const resolved = project ?? config.project
  const name = resolved?.name ?? ""
  const version = resolved?.version ?? ""
  const homepage = resolved?.homepage ?? ""
  if (name === "") return null
  const label = version !== "" ? `${name} v${version}` : name
  return homepage !== "" ? (
    <a href={homepage} className={styles.footerLink}>
      {label}
    </a>
  ) : (
    <span>{label}</span>
  )
}

function FooterSponsorLink({
  label,
  sponsor,
}: {
  label: string
  sponsor: ArdoFooterProps["sponsor"]
}) {
  const text = sponsor?.text ?? ""
  const link = sponsor?.link ?? ""
  if (text === "" || link === "") return null
  return (
    <a href={link} className={styles.footerLink}>
      {label} {text}
    </a>
  )
}

function FooterPrimaryLine({
  project,
  sponsor,
  ardoLink,
  config,
  sponsoredByLabel,
  builtWithArdoLabel,
}: {
  project: ArdoFooterProps["project"]
  sponsor: ArdoFooterProps["sponsor"]
  ardoLink: boolean
  config: ReturnType<typeof useArdoConfig>
  sponsoredByLabel: string
  builtWithArdoLabel: string
}) {
  const items: React.ReactNode[] = []
  const projectNode = <FooterProjectLink project={project} config={config} />
  const sponsorNode = <FooterSponsorLink label={sponsoredByLabel} sponsor={sponsor} />
  const hasProject =
    (project ?? config.project)?.name !== undefined && (project ?? config.project)?.name !== ""
  const hasSponsor = (sponsor?.text ?? "") !== "" && (sponsor?.link ?? "") !== ""

  if (hasProject) items.push(projectNode)
  if (ardoLink)
    items.push(
      <a href="https://ardo-docs.dev" className={styles.footerArdoLink}>
        <ArdoOwlMark size={16} className={styles.footerOwl} title="" />
        {builtWithArdoLabel}
      </a>
    )
  if (hasSponsor) items.push(sponsorNode)
  if (items.length === 0) return null

  return (
    <p className={styles.footerPrimary}>
      {items.map((item, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>
          {i > 0 && <span className={styles.footerSeparator} aria-hidden="true" />}
          {item}
        </React.Fragment>
      ))}
    </p>
  )
}

function hasFooterContent(value: ReactNode): boolean {
  return value != null && value !== false && value !== ""
}

function FooterTextLine({
  children,
  className,
  trustedHtml,
}: {
  children?: ReactNode
  className: string
  trustedHtml?: string
}) {
  const hasTrustedHtml = (trustedHtml ?? "") !== ""
  if (hasTrustedHtml) {
    return (
      <p
        className={className}
        // The prop name marks this as caller-trusted HTML. Plain message/copyright props render escaped React content.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: trustedHtml ?? "" }}
      />
    )
  }

  if (!hasFooterContent(children)) {
    return null
  }

  return <p className={className}>{children}</p>
}

export function ArdoFooter({
  children,
  className,
  ardoLink = true,
  message,
  trustedMessageHtml,
  copyright,
  trustedCopyrightHtml,
  project,
  sponsor,
  buildTime,
  buildHash,
}: ArdoFooterProps) {
  const config = useArdoConfig()
  const labels = useArdoLabels()
  const resolvedBuildTime = buildTime ?? config.buildTime
  const resolvedBuildHash = buildHash ?? config.buildHash

  if (children != null) {
    return (
      <footer className={joinClassNames("ardo-footer", className ?? styles.footer)}>
        <div className={styles.footerContainer}>{children}</div>
      </footer>
    )
  }

  return (
    <footer className={joinClassNames("ardo-footer", className ?? styles.footer)}>
      <div className={styles.footerContainer}>
        <FooterPrimaryLine
          project={project}
          sponsor={sponsor}
          ardoLink={ardoLink}
          config={config}
          sponsoredByLabel={labels.footer.sponsoredBy}
          builtWithArdoLabel={labels.footer.builtWithArdo}
        />
        <FooterTextLine className={styles.footerMessage} trustedHtml={trustedMessageHtml}>
          {message}
        </FooterTextLine>
        <FooterTextLine className={styles.footerCopyright} trustedHtml={trustedCopyrightHtml}>
          {copyright}
        </FooterTextLine>
        {(resolvedBuildTime ?? "") !== "" && (
          <p className={styles.footerBuildTime}>
            {labels.footer.builtOn} {formatBuildTime(resolvedBuildTime ?? "", config.lang ?? "en")}
            {(resolvedBuildHash ?? "") !== "" && <> ({resolvedBuildHash})</>}
          </p>
        )}
      </div>
    </footer>
  )
}

// Type exports for compound pattern (kept for backwards compatibility)
export type ArdoFooterMessageProps = {
  children: ReactNode
  className?: string
}

export type ArdoFooterCopyrightProps = {
  children: ReactNode
  className?: string
}
