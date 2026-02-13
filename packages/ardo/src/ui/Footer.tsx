import { type ReactNode } from "react"
import type { ProjectMeta, SponsorConfig } from "../config/types"

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
 * When `children` is provided, all automatic rendering is skipped.
 *
 * @example Structured usage
 * ```tsx
 * <Footer
 *   project={config.project}
 *   sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
 *   buildTime={config.buildTime}
 *   message="Released under the MIT License."
 *   copyright="Copyright 2026 Sebastian Software GmbH"
 * />
 * ```
 *
 * @example Simple usage
 * ```tsx
 * <Footer message="MIT License" copyright="2026 Sebastian Software" />
 * ```
 *
 * @example Custom content
 * ```tsx
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
  ardoLink = true,
}: FooterProps) {
  const hasContent = message || copyright || children || project || sponsor || buildTime || ardoLink

  if (!hasContent) {
    return null
  }

  return (
    <footer className={className ?? "ardo-footer"}>
      <div className="ardo-footer-container">
        {children ?? (
          <>
            {/* Primary line: project · ardo · sponsor */}
            {(project || ardoLink || sponsor) && (
              <p className="ardo-footer-primary">
                {project?.name && (
                  <>
                    {project.homepage ? (
                      <a href={project.homepage} className="ardo-footer-link">
                        {project.name}
                        {project.version ? ` v${project.version}` : ""}
                      </a>
                    ) : (
                      <span>
                        {project.name}
                        {project.version ? ` v${project.version}` : ""}
                      </span>
                    )}
                  </>
                )}
                {project?.name && ardoLink && (
                  <span className="ardo-footer-separator" aria-hidden="true" />
                )}
                {ardoLink && (
                  <a href="https://ardo-docs.dev" className="ardo-footer-link">
                    Built with Ardo
                  </a>
                )}
                {(project?.name || ardoLink) && sponsor && (
                  <span className="ardo-footer-separator" aria-hidden="true" />
                )}
                {sponsor && (
                  <a href={sponsor.link} className="ardo-footer-link">
                    Sponsored by {sponsor.text}
                  </a>
                )}
              </p>
            )}
            {/* Secondary line: message / copyright */}
            {message && (
              <p className="ardo-footer-message" dangerouslySetInnerHTML={{ __html: message }} />
            )}
            {copyright && (
              <p
                className="ardo-footer-copyright"
                dangerouslySetInnerHTML={{ __html: copyright }}
              />
            )}
            {/* Tertiary line: build timestamp */}
            {buildTime && (
              <p className="ardo-footer-build-time">Built on {formatBuildTime(buildTime)}</p>
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
