import type { ArdoBrandConfig, ArdoBrandHue } from "./types"

export const brandHuePresets = {
  amber: 70,
  berry: 356,
  blue: 240,
  gray: 260,
  green: 130,
  indigo: 270,
  orange: 45,
  pink: 330,
  purple: 290,
  red: 25,
  slate: 260,
  teal: 170,
} as const

type BrandHueKey = "accent" | "color" | "neutral"

export type ResolvedBrandHues = Partial<Record<BrandHueKey, number>>

const DEFAULT_SECONDARY_OFFSET = 234

export function resolveBrandThemeHues(brand: ArdoBrandConfig | undefined): ResolvedBrandHues {
  if (brand == null) {
    return {}
  }

  const color = resolveBrandHue(brand.color, "color")
  return {
    color,
    accent:
      brand.accent === undefined
        ? color === undefined
          ? undefined
          : defaultAccent(color)
        : resolveBrandHue(brand.accent, "accent"),
    neutral: brand.neutral === undefined ? color : resolveBrandHue(brand.neutral, "neutral"),
  }
}

export function createBrandThemeCss(brand: ArdoBrandConfig | undefined): string | undefined {
  const hues = resolveBrandThemeHues(brand)
  const declarations = [
    createHueDeclaration("brand", hues.color),
    createHueDeclaration("accent", hues.accent),
    createHueDeclaration("neutral", hues.neutral),
  ].filter((declaration) => declaration !== undefined)

  if (declarations.length === 0) {
    return undefined
  }

  return `:root{${declarations.join("")}}`
}

export function resolveBrandHue(
  value: ArdoBrandHue | undefined,
  key: BrandHueKey
): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`brand.${key} must be a finite hue number or a known preset.`)
    }
    return normalizeHue(value)
  }

  const presetName: unknown = value
  if (!isBrandHuePresetName(presetName)) {
    throw new TypeError(
      `brand.${key} must be one of ${Object.keys(brandHuePresets)
        .map((name) => `"${name}"`)
        .join(", ")} or a hue number.`
    )
  }

  return brandHuePresets[presetName]
}

function isBrandHuePresetName(value: unknown): value is keyof typeof brandHuePresets {
  return typeof value === "string" && value in brandHuePresets
}

function defaultAccent(color: number): number {
  return normalizeHue(color + DEFAULT_SECONDARY_OFFSET)
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360
}

function createHueDeclaration(name: "accent" | "brand" | "neutral", value: number | undefined) {
  return value === undefined ? undefined : `--ardo-hue-${name}:${value};`
}
