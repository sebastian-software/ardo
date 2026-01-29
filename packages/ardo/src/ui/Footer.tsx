import { type ReactNode } from "react"

// =============================================================================
// Footer Component
// =============================================================================

export interface FooterProps {
  /** Footer message (supports HTML string) */
  message?: string
  /** Copyright text (supports HTML string) */
  copyright?: string
  /** Custom content (overrides message/copyright) */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Footer component with message and copyright props.
 *
 * @example Simple usage
 * ```tsx
 * <Footer message="MIT License" copyright="2026 Sebastian Software" />
 * ```
 *
 * @example With HTML
 * ```tsx
 * <Footer
 *   message="Built with <a href='...'>Ardo</a>"
 *   copyright="Copyright &copy; 2026"
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
export function Footer({ message, copyright, children, className }: FooterProps) {
  const hasContent = message || copyright || children

  if (!hasContent) {
    return null
  }

  return (
    <footer className={className ?? "ardo-footer"}>
      <div className="ardo-footer-container">
        {children ?? (
          <>
            {message && (
              <p className="ardo-footer-message" dangerouslySetInnerHTML={{ __html: message }} />
            )}
            {copyright && (
              <p
                className="ardo-footer-copyright"
                dangerouslySetInnerHTML={{ __html: copyright }}
              />
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
