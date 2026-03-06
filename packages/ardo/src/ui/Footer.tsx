import React, { type ReactNode } from "react"

import type { ProjectMeta, SponsorConfig } from "../config/types"

import { useArdoConfig } from "../runtime/hooks"
import * as styles from "./Footer.css"

// =============================================================================
// Footer Component
// =============================================================================

export interface ArdoFooterProps {
  /** Footer message (supports HTML string) */
  message?: string
  /** Copyright text (supports HTML string) */
  copyright?: string
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

function formatBuildTime(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
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

function FooterSponsorLink({ sponsor }: { sponsor: ArdoFooterProps["sponsor"] }) {
  const text = sponsor?.text ?? ""
  const link = sponsor?.link ?? ""
  if (text === "" || link === "") return null
  return (
    <a href={link} className={styles.footerLink}>
      Sponsored by {text}
    </a>
  )
}

function FooterPrimaryLine({
  project,
  sponsor,
  ardoLink,
  config,
}: {
  project: ArdoFooterProps["project"]
  sponsor: ArdoFooterProps["sponsor"]
  ardoLink: boolean
  config: ReturnType<typeof useArdoConfig>
}) {
  const items: React.ReactNode[] = []
  const projectNode = <FooterProjectLink project={project} config={config} />
  const sponsorNode = <FooterSponsorLink sponsor={sponsor} />
  const hasProject =
    (project ?? config.project)?.name !== undefined && (project ?? config.project)?.name !== ""
  const hasSponsor = (sponsor?.text ?? "") !== "" && (sponsor?.link ?? "") !== ""

  if (hasProject) items.push(projectNode)
  if (ardoLink)
    items.push(
      <a href="https://ardo-docs.dev" className={styles.footerLink}>
        Built with Ardo
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

export function ArdoFooter({
  children,
  className,
  ardoLink = true,
  message,
  copyright,
  project,
  sponsor,
  buildTime,
  buildHash,
}: ArdoFooterProps) {
  const config = useArdoConfig()
  const resolvedBuildTime = buildTime ?? config.buildTime
  const resolvedBuildHash = buildHash ?? config.buildHash

  if (children != null) {
    return (
      <footer className={className ?? styles.footer}>
        <div className={styles.footerContainer}>{children}</div>
      </footer>
    )
  }

  return (
    <footer className={className ?? styles.footer}>
      <div className={styles.footerContainer}>
        <FooterPrimaryLine
          project={project}
          sponsor={sponsor}
          ardoLink={ardoLink}
          config={config}
        />
        {(message ?? "") !== "" && (
          <p className={styles.footerMessage} dangerouslySetInnerHTML={{ __html: message ?? "" }} />
        )}
        {(copyright ?? "") !== "" && (
          <p
            className={styles.footerCopyright}
            dangerouslySetInnerHTML={{ __html: copyright ?? "" }}
          />
        )}
        {(resolvedBuildTime ?? "") !== "" && (
          <p className={styles.footerBuildTime}>
            Built on {formatBuildTime(resolvedBuildTime ?? "")}
            {(resolvedBuildHash ?? "") !== "" && <> ({resolvedBuildHash})</>}
          </p>
        )}
      </div>
    </footer>
  )
}

// Type exports for compound pattern (kept for backwards compatibility)
export interface ArdoFooterMessageProps {
  children: ReactNode
  className?: string
}

export interface ArdoFooterCopyrightProps {
  children: ReactNode
  className?: string
}
