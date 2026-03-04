import { type ReactNode } from "react"
import type { ProjectMeta, SponsorConfig } from "../config/types"
import { useConfig, useThemeConfig } from "../runtime/hooks"
import * as styles from "./Footer.css"

// =============================================================================
// Footer Component
// =============================================================================

export interface FooterProps {
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
 * `config.buildHash`, `themeConfig.footer.*`). Props serve as overrides.
 *
 * When `children` is provided, all automatic rendering is skipped.
 *
 * @example Automatic (zero-config)
 * ```
 * <Footer />
 * ```
 *
 * @example With overrides
 * ```
 * <Footer
 *   sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
 *   message="Released under the MIT License."
 *   copyright="Copyright 2026 Sebastian Software GmbH"
 * />
 * ```
 *
 * @example Custom content
 * ```
 * <Footer>
 *   <CustomFooterContent />
 * </Footer>
 * ```
 */
export function Footer({
  message,
  copyright,
  children,
  className,
  project,
  sponsor,
  buildTime,
  buildHash,
  ardoLink = true,
}: FooterProps) {
  const config = useConfig()
  const themeConfig = useThemeConfig()

  const resolvedProject = project ?? config.project
  const resolvedBuildTime = buildTime ?? config.buildTime
  const resolvedBuildHash = buildHash ?? config.buildHash
  const resolvedMessage = message ?? themeConfig.footer?.message
  const resolvedCopyright = copyright ?? themeConfig.footer?.copyright
  const resolvedSponsor = sponsor ?? themeConfig.footer?.sponsor

  const hasContent =
    resolvedMessage ||
    resolvedCopyright ||
    children ||
    resolvedProject ||
    resolvedSponsor ||
    resolvedBuildTime ||
    ardoLink

  if (!hasContent) {
    return null
  }

  return (
    <footer className={className ?? styles.footer}>
      <div className="ardo-footer-container" /* container has no special styles */>
        {children ?? (
          <>
            {/* Primary line: project · ardo · sponsor */}
            {(resolvedProject || ardoLink || resolvedSponsor) && (
              <p className={styles.footerPrimary}>
                {resolvedProject?.name && (
                  <>
                    {resolvedProject.homepage ? (
                      <a href={resolvedProject.homepage} className={styles.footerLink}>
                        {resolvedProject.name}
                        {resolvedProject.version ? ` v${resolvedProject.version}` : ""}
                      </a>
                    ) : (
                      <span>
                        {resolvedProject.name}
                        {resolvedProject.version ? ` v${resolvedProject.version}` : ""}
                      </span>
                    )}
                  </>
                )}
                {resolvedProject?.name && ardoLink && (
                  <span className={styles.footerSeparator} aria-hidden="true" />
                )}
                {ardoLink && (
                  <a href="https://ardo-docs.dev" className={styles.footerLink}>
                    Built with Ardo
                  </a>
                )}
                {(resolvedProject?.name || ardoLink) && resolvedSponsor && (
                  <span className={styles.footerSeparator} aria-hidden="true" />
                )}
                {resolvedSponsor && (
                  <a href={resolvedSponsor.link} className={styles.footerLink}>
                    Sponsored by {resolvedSponsor.text}
                  </a>
                )}
              </p>
            )}
            {/* Secondary line: message / copyright */}
            {resolvedMessage && (
              <p
                className={styles.footerMessage}
                dangerouslySetInnerHTML={{ __html: resolvedMessage }}
              />
            )}
            {resolvedCopyright && (
              <p
                className={styles.footerCopyright}
                dangerouslySetInnerHTML={{ __html: resolvedCopyright }}
              />
            )}
            {/* Tertiary line: build timestamp */}
            {resolvedBuildTime && (
              <p className={styles.footerBuildTime}>
                Built on {formatBuildTime(resolvedBuildTime)}
                {resolvedBuildHash && <> ({resolvedBuildHash})</>}
              </p>
            )}
          </>
        )}
      </div>
    </footer>
  )
}

// Type exports for compound pattern (kept for backwards compatibility)
export interface FooterMessageProps {
  children: ReactNode
  className?: string
}

export interface FooterCopyrightProps {
  children: ReactNode
  className?: string
}
