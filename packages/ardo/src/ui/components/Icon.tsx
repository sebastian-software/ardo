import type { LucideProps, LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface IconProps extends Omit<LucideProps, "ref"> {
  /** Name of the registered icon */
  name: string
}

// Icon registry - users register only the icons they need
const iconRegistry = new Map<string, LucideIcon>()

/**
 * Register icons for use with the Icon component.
 * Only registered icons are included in your bundle.
 *
 * @example
 * ```tsx
 * // In your app's entry point or layout:
 * import { registerIcons } from "ardo/ui"
 * import { Zap, Rocket, Code } from "lucide-react"
 *
 * registerIcons({ Zap, Rocket, Code })
 * ```
 */
export function registerIcons(icons: Record<string, LucideIcon>): void {
  for (const [name, icon] of Object.entries(icons)) {
    iconRegistry.set(name, icon)
  }
}

/**
 * Get all registered icon names (useful for documentation).
 */
export function getRegisteredIconNames(): string[] {
  return Array.from(iconRegistry.keys())
}

/**
 * Renders a registered Lucide icon by name.
 * Icons must be registered first using `registerIcons()`.
 *
 * @example
 * ```tsx
 * // First register icons in your app:
 * import { registerIcons } from "ardo/ui"
 * import { Zap, Rocket } from "lucide-react"
 * registerIcons({ Zap, Rocket })
 *
 * // Then use in MDX:
 * <Icon name="Zap" size={24} />
 * <Icon name="Rocket" className="text-brand" />
 * ```
 *
 * @see https://lucide.dev/icons for available icon names
 */
export function Icon({ name, ...props }: IconProps): ReactNode {
  const LucideIcon = iconRegistry.get(name)

  if (!LucideIcon) {
    console.warn(`[Ardo] Icon "${name}" not found. Did you register it with registerIcons()?`)
    return null
  }

  return <LucideIcon {...props} />
}
