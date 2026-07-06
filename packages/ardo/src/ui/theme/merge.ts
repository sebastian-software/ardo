import type { ArdoThemeTokenOverrides, ArdoThemeTokens } from "./tokens"

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K]
}

export function mergeThemeTokens(
  base: ArdoThemeTokens,
  ...overrides: Array<ArdoThemeTokenOverrides | undefined>
): ArdoThemeTokens {
  let merged = base
  for (const override of overrides) {
    if (override == null) {
      continue
    }

    merged = {
      ...merged,
      ...override,
      color: { ...merged.color, ...override.color },
      font: { ...merged.font, ...override.font },
      fontSize: { ...merged.fontSize, ...override.fontSize },
      hue: { ...merged.hue, ...override.hue },
      layout: { ...merged.layout, ...override.layout },
      radius: { ...merged.radius, ...override.radius },
      space: { ...merged.space, ...override.space },
      transition: { ...merged.transition, ...override.transition },
    }
  }
  return merged
}
