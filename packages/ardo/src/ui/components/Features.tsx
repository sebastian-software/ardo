import { Link } from "react-router"
import type { ReactNode } from "react"
import * as styles from "./Features.css"

export interface ArdoFeaturesProps {
  /** Feature cards as children */
  children: ReactNode
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Additional CSS class */
  className?: string
}

export interface ArdoFeatureCardProps {
  /** Feature title */
  title: string
  /** Icon as ReactNode (emoji, Lucide icon component, or any JSX) */
  icon?: ReactNode
  /** Feature description as children */
  children: ReactNode
  /** Optional link */
  link?: string
  /** Link text (defaults to "Learn more") */
  linkText?: string
  /** Additional CSS class */
  className?: string
}

/**
 * Individual feature card component.
 *
 * @example
 * ```tsx
 * import { Zap } from "lucide-react"
 *
 * <ArdoFeatureCard title="Fast" icon={<Zap size={28} />}>
 *   Lightning fast builds with Vite
 * </ArdoFeatureCard>
 * ```
 */
export function ArdoFeatureCard({
  title,
  icon,
  children,
  link,
  linkText,
  className,
}: ArdoFeatureCardProps) {
  return (
    <div className={className ?? styles.feature}>
      {icon && <div className={styles.featureIcon}>{icon}</div>}
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDetails}>{children}</p>
      {link && (
        <Link to={link} className={styles.featureLink}>
          {linkText || "Learn more"}
        </Link>
      )}
    </div>
  )
}

/**
 * Features grid component for displaying multiple feature cards.
 *
 * @example
 * ```tsx
 * <ArdoFeatures title="Key Features" subtitle="Everything you need">
 *   <ArdoFeatureCard title="React-First" icon="⚛️">Built on React.</ArdoFeatureCard>
 *   <ArdoFeatureCard title="Fast" icon="⚡">Powered by Vite.</ArdoFeatureCard>
 * </ArdoFeatures>
 * ```
 */
export function ArdoFeatures({ children, title, subtitle, className }: ArdoFeaturesProps) {
  return (
    <section className={className ?? styles.features}>
      {(title || subtitle) && (
        <div className={styles.featuresHeader}>
          {title && <h2 className={styles.featuresTitle}>{title}</h2>}
          {subtitle && <p className={styles.featuresSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.featuresContainer}>{children}</div>
    </section>
  )
}
