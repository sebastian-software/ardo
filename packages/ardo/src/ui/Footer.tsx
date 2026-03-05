import type { ReactNode } from "react"

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
export function ArdoFooter({
  message,
  copyright,
  children,
  className,
  project,
  sponsor,
  buildTime,
  buildHash,
  ardoLink = true,
}: ArdoFooterProps) {
  const config = useArdoConfig()

  const resolvedProject = project ?? config.project
  const resolvedBuildTime = buildTime ?? config.buildTime
  const resolvedBuildHash = buildHash ?? config.buildHash
  const resolvedMessage = message
  const resolvedCopyright = copyright
  const resolvedSponsor = sponsor
  const projectName = resolvedProject?.name ?? ""
  const projectVersion = resolvedProject?.version ?? ""
  const projectHomepage = resolvedProject?.homepage ?? ""
  const sponsorText = resolvedSponsor?.text ?? ""
  const sponsorLink = resolvedSponsor?.link ?? ""
  const hasProjectName = projectName !== ""
  const hasProjectHomepage = projectHomepage !== ""
  const hasSponsor = sponsorText !== "" && sponsorLink !== ""
  const hasMessage = (resolvedMessage ?? "") !== ""
  const hasCopyright = (resolvedCopyright ?? "") !== ""
  const hasBuildTime = (resolvedBuildTime ?? "") !== ""
  const hasBuildHash = (resolvedBuildHash ?? "") !== ""
  const hasCustomChildren = children != null
  const hasPrimaryLine = hasProjectName || ardoLink || hasSponsor

  const hasContent =
    hasMessage || hasCopyright || hasCustomChildren || hasPrimaryLine || hasBuildTime || ardoLink

  if (!hasContent) {
    return null
  }

  return (
    <footer className={className ?? styles.footer}>
      <div className={styles.footerContainer}>
        {children ?? (
          <>
            {/* Primary line: project · ardo · sponsor */}
            {hasPrimaryLine && (
              <p className={styles.footerPrimary}>
                {hasProjectName && (
                  <>
                    {hasProjectHomepage ? (
                      <a href={projectHomepage} className={styles.footerLink}>
                        {projectName}
                        {projectVersion !== "" ? ` v${projectVersion}` : ""}
                      </a>
                    ) : (
                      <span>
                        {projectName}
                        {projectVersion !== "" ? ` v${projectVersion}` : ""}
                      </span>
                    )}
                  </>
                )}
                {hasProjectName && ardoLink && (
                  <span className={styles.footerSeparator} aria-hidden="true" />
                )}
                {ardoLink && (
                  <a href="https://ardo-docs.dev" className={styles.footerLink}>
                    Built with Ardo
                  </a>
                )}
                {(hasProjectName || ardoLink) && hasSponsor && (
                  <span className={styles.footerSeparator} aria-hidden="true" />
                )}
                {hasSponsor && (
                  <a href={sponsorLink} className={styles.footerLink}>
                    Sponsored by {sponsorText}
                  </a>
                )}
              </p>
            )}
            {/* Secondary line: message / copyright */}
            {hasMessage && (
              <p
                className={styles.footerMessage}
                dangerouslySetInnerHTML={{ __html: resolvedMessage ?? "" }}
              />
            )}
            {hasCopyright && (
              <p
                className={styles.footerCopyright}
                dangerouslySetInnerHTML={{ __html: resolvedCopyright ?? "" }}
              />
            )}
            {/* Tertiary line: build timestamp */}
            {hasBuildTime && (
              <p className={styles.footerBuildTime}>
                Built on {formatBuildTime(resolvedBuildTime ?? "")}
                {hasBuildHash && <> ({resolvedBuildHash ?? ""})</>}
              </p>
            )}
          </>
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
