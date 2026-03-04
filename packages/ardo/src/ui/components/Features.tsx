import { Link } from "react-router"
import type { CSSProperties, ReactNode } from "react"
import * as styles from "./Features.css"

export interface FeatureItem {
  /** Feature title */
  title: string
  /** Icon as ReactNode (emoji, Lucide icon component, or any JSX) */
  icon?: ReactNode
  /** Feature description */
  details: string
  /** Optional link */
  link?: string
  /** Link text (defaults to "Learn more") */
  linkText?: string
}

export interface FeaturesProps {
  /** Array of feature items to display */
  items: FeatureItem[]
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Additional CSS class */
  className?: string
}

export interface FeatureCardProps extends FeatureItem {
  /** Additional CSS class */
  className?: string
}

/**
 * Individual feature card component.
 *
 * @example
 * ```
 * import { Zap } from "lucide-react"
 *
 * // Using emoji
 * <FeatureCard title="Fast" icon="⚡" details="Lightning fast." />
 *
 * // Using Lucide icon (tree-shakeable)
 * <FeatureCard title="Fast" icon={<Zap size={28} />} details="Lightning fast." />
 * ```
 */
export function FeatureCard({
  title,
  icon,
  details,
  link,
  linkText,
  className,
  style,
}: FeatureCardProps & { style?: CSSProperties }) {
  return (
    <div className={className ?? styles.feature} style={style}>
      {icon && <div className={styles.featureIcon}>{icon}</div>}
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDetails}>{details}</p>
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
 * ```
 * <Features
 *   title="Key Features"
 *   subtitle="Everything you need to build great docs"
 *   items={[
 *     { title: "React-First", icon: "⚛️", details: "Built on React." },
 *     { title: "Fast", icon: "⚡", details: "Powered by Vite." },
 *     { title: "Type-Safe", icon: "📝", details: "Full TypeScript support." },
 *   ]}
 * />
 * ```
 */
export function Features({ items, title, subtitle, className }: FeaturesProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <section className={className ?? styles.features}>
      {(title || subtitle) && (
        <div className={styles.featuresHeader}>
          {title && <h2 className={styles.featuresTitle}>{title}</h2>}
          {subtitle && <p className={styles.featuresSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.featuresContainer}>
        {items.map((feature, index) => (
          <FeatureCard key={index} {...feature} style={{ animationDelay: `${index * 80}ms` }} />
        ))}
      </div>
    </section>
  )
}
