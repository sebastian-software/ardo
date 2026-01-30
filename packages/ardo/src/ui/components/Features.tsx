import { Link } from "react-router"
import type { ReactNode } from "react"

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
 * ```tsx
 * import { Zap } from "lucide-react"
 *
 * // Using emoji
 * <FeatureCard title="Fast" icon="⚡" details="Lightning fast." />
 *
 * // Using Lucide icon (tree-shakeable)
 * <FeatureCard title="Fast" icon={<Zap size={28} />} details="Lightning fast." />
 * ```
 */
export function FeatureCard({ title, icon, details, link, linkText, className }: FeatureCardProps) {
  return (
    <div className={className ?? "ardo-feature"}>
      {icon && <div className="ardo-feature-icon">{icon}</div>}
      <h3 className="ardo-feature-title">{title}</h3>
      <p className="ardo-feature-details">{details}</p>
      {link && (
        <Link to={link} className="ardo-feature-link">
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
 * <Features items={[
 *   { title: "React-First", icon: "⚛️", details: "Built on React." },
 *   { title: "Fast", icon: "⚡", details: "Powered by Vite." },
 *   { title: "Type-Safe", icon: "📝", details: "Full TypeScript support." },
 * ]} />
 * ```
 */
export function Features({ items, className }: FeaturesProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <section className={className ?? "ardo-features"}>
      <div className="ardo-features-container">
        {items.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  )
}
