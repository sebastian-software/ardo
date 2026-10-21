import { type ComponentType, createElement, type ReactNode, type SVGAttributes } from "react"

import * as builtinIcons from "../content-icons"

type IconComponent = ComponentType<{ size?: number } & SVGAttributes<SVGSVGElement>>

export type ArdoIconProps = {
  /** Name of the registered icon */
  name: string
  /** Icon size */
  size?: number
} & SVGAttributes<SVGSVGElement>

// Core icons are available immediately; sites can add or override names.
const iconRegistry = new Map<string, IconComponent>(Object.entries(builtinIcons))

/**
 * Add custom icons or override built-in names for the Icon component.
 * The 50 built-in Core icons are already registered.
 *
 * @example
 * ```tsx
 * // In your app's entry point or layout:
 * import { registerIcons } from "ardo/ui"
 * import { Github } from "ardo/icons"
 *
 * registerIcons({ Github })
 * ```
 */
export function registerIcons(icons: Record<string, IconComponent>): void {
  for (const [name, icon] of Object.entries(icons)) {
    iconRegistry.set(name, icon)
  }
}

/**
 * Get all registered icon names (useful for documentation).
 */
export function getRegisteredIconNames(): string[] {
  return [...iconRegistry.keys()]
}

/**
 * Renders a registered icon by name.
 * Built-in Core icons work immediately; register additional icons with `registerIcons()`.
 *
 * @example
 * ```tsx
 * // Use built-in names directly in MDX:
 * <Icon name="Zap" size={24} />
 * <Icon name="Rocket" className="text-brand" />
 * ```
 *
 * @see ardo/icons for the built-in Streamline Core components
 */
export function ArdoIcon({ name, ...props }: ArdoIconProps): ReactNode {
  const IconComp = iconRegistry.get(name)

  if (!IconComp) {
    console.warn(
      `[Ardo] Icon "${name}" not found. Use a built-in Core icon or register it with registerIcons().`
    )
    return null
  }

  return createElement(IconComp, props)
}
