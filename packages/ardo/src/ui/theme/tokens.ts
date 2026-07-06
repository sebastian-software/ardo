/* eslint-disable max-lines -- This file intentionally keeps the generated token table together. */
/**
 * Pre-computed OKLCH color values for both light and dark themes.
 * No more `calc(var(...))` chains — all values are resolved here.
 */

import { createGlobalTheme } from "@vanilla-extract/css"

import { vars } from "./contract.css"

type HueValue = number | string
type PrimitiveToken = number | string
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends PrimitiveToken ? T[K] : DeepPartial<T[K]>
}

// eslint-disable-next-line max-params -- mirrors CSS oklch() syntax
const oklch = (l: number, c: number, h: HueValue, alpha?: number) =>
  alpha !== undefined ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`

function hueOffset(hue: HueValue, offset: number): HueValue {
  return typeof hue === "number" ? hue + offset : `calc(${hue} + ${offset})`
}

const fontFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const fontMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

const fontHeading = fontFamily

const shared = {
  layout: {
    sidebarWidth: "20rem",
    tocWidth: "15rem",
    contentMaxWidth: "68ch",
    headerHeight: "3.5rem",
  },
  transition: {
    fast: "0.12s ease-out",
    base: "0.2s ease-out",
    slow: "0.35s ease-out",
  },
  font: {
    family: fontFamily,
    mono: fontMono,
    familyHeading: fontHeading,
    size: "1rem",
    lineHeight: "1.72",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    smd: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "6rem",
    section: "clamp(3rem, 6vw, 5rem)",
    content: "clamp(1.5rem, 3vw, 2.5rem)",
  },
  radius: {
    sm: "0.25rem",
    base: "0.5rem",
    lg: "0.75rem",
  },
}

function createLightColors() {
  const primary = vars.hue.brand
  const secondary = vars.hue.accent
  const neutral = vars.hue.neutral
  return {
    brand: oklch(0.5, 0.1, primary),
    brandLight: oklch(0.62, 0.09, primary),
    brandDark: oklch(0.39, 0.11, primary),
    brandSubtle: oklch(0.955, 0.025, primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.5, 0.1, primary)} 0%, ${oklch(0.6, 0.075, hueOffset(primary, 16))} 100%)`,
    accent: oklch(0.5, 0.075, secondary),
    accentLight: oklch(0.62, 0.07, secondary),
    accentDark: oklch(0.38, 0.085, secondary),
    accentSubtle: oklch(0.963, 0.012, secondary),
    bg: oklch(0.992, 0.0015, neutral),
    bgSoft: oklch(0.975, 0.003, neutral),
    bgMute: oklch(0.955, 0.004, neutral),
    bgAlt: oklch(0.935, 0.005, neutral),
    text: oklch(0.17, 0.008, neutral),
    textLight: oklch(0.4, 0.007, neutral),
    textLighter: oklch(0.56, 0.005, neutral),
    border: oklch(0.88, 0.005, neutral),
    borderLight: oklch(0.925, 0.003, neutral),
    divider: oklch(0.89, 0.004, neutral),
    sidebarBg: oklch(0.965, 0.004, neutral),
    sidebarBorder: oklch(0.885, 0.005, neutral),
    codeBg: oklch(0.965, 0.012, secondary),
    codeBorder: oklch(0.88, 0.016, secondary),
    codeShadow: "0 1px 2px oklch(0 0 0 / 0.025)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.035), 0 1px 3px oklch(0 0 0 / 0.045)",
    shadowMd: "0 8px 18px oklch(0 0 0 / 0.045), 0 2px 6px oklch(0 0 0 / 0.035)",
    shadowLg: "0 18px 42px oklch(0 0 0 / 0.075), 0 6px 18px oklch(0 0 0 / 0.045)",
    tip: oklch(0.5, 0.15, 155),
    tipBg: oklch(0.97, 0.025, 155),
    tipBorder: oklch(0.85, 0.08, 155),
    warning: oklch(0.55, 0.16, 45),
    warningBg: oklch(0.98, 0.03, 45),
    warningBorder: oklch(0.88, 0.1, 45),
    danger: oklch(0.5, 0.18, 25),
    dangerBg: oklch(0.97, 0.02, 25),
    dangerBorder: oklch(0.85, 0.1, 25),
    info: oklch(0.5, 0.14, 220),
    infoBg: oklch(0.97, 0.02, 220),
    infoBorder: oklch(0.85, 0.08, 220),
    note: oklch(0.5, 0.14, 270),
    noteBg: oklch(0.97, 0.02, 270),
    noteBorder: oklch(0.88, 0.08, 270),
    badgeBlue: oklch(0.45, 0.12, 250),
    badgeBlueBg: oklch(0.97, 0.02, 250),
    badgeBlueBorder: oklch(0.88, 0.06, 250),
    badgeGreen: oklch(0.42, 0.12, 155),
    badgeGreenBg: oklch(0.97, 0.02, 155),
    badgeGreenBorder: oklch(0.88, 0.06, 155),
    badgeAmber: oklch(0.5, 0.14, 70),
    badgeAmberBg: oklch(0.97, 0.03, 70),
    badgeAmberBorder: oklch(0.88, 0.08, 70),
    badgeRed: oklch(0.5, 0.16, 25),
    badgeRedBg: oklch(0.97, 0.02, 25),
    badgeRedBorder: oklch(0.88, 0.07, 25),
    badgePurple: oklch(0.45, 0.15, 300),
    badgePurpleBg: oklch(0.97, 0.02, 300),
    badgePurpleBorder: oklch(0.88, 0.06, 300),
    badgePink: oklch(0.5, 0.14, 350),
    badgePinkBg: oklch(0.97, 0.02, 350),
    badgePinkBorder: oklch(0.88, 0.06, 350),
  }
}

function createDarkColors() {
  const primary = vars.hue.brand
  const secondary = vars.hue.accent
  const neutral = vars.hue.neutral
  return {
    brand: oklch(0.74, 0.115, primary),
    brandLight: oklch(0.84, 0.1, primary),
    brandDark: oklch(0.62, 0.125, primary),
    brandSubtle: oklch(0.275, 0.06, primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.74, 0.115, primary)} 0%, ${oklch(0.81, 0.08, hueOffset(primary, 16))} 100%)`,
    accent: oklch(0.74, 0.08, secondary),
    accentLight: oklch(0.84, 0.07, secondary),
    accentDark: oklch(0.6, 0.09, secondary),
    accentSubtle: oklch(0.26, 0.03, secondary),
    bg: oklch(0.155, 0.008, neutral),
    bgSoft: oklch(0.195, 0.009, neutral),
    bgMute: oklch(0.255, 0.01, neutral),
    bgAlt: oklch(0.33, 0.01, neutral),
    text: oklch(0.94, 0.004, neutral),
    textLight: oklch(0.72, 0.007, neutral),
    textLighter: oklch(0.55, 0.007, neutral),
    border: oklch(0.285, 0.011, neutral),
    borderLight: oklch(0.35, 0.01, neutral),
    divider: oklch(0.29, 0.01, neutral),
    sidebarBg: oklch(0.13, 0.008, neutral),
    sidebarBorder: oklch(0.265, 0.011, neutral),
    codeBg: oklch(0.21, 0.016, secondary),
    codeBorder: oklch(0.33, 0.024, secondary),
    codeShadow: "0 10px 26px oklch(0 0 0 / 0.18)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.14), 0 1px 3px oklch(0 0 0 / 0.18)",
    shadowMd: "0 8px 18px oklch(0 0 0 / 0.18), 0 2px 6px oklch(0 0 0 / 0.12)",
    shadowLg: "0 20px 50px oklch(0 0 0 / 0.28), 0 8px 20px oklch(0 0 0 / 0.18)",
    tip: oklch(0.5, 0.15, 155),
    tipBg: oklch(0.2, 0.04, 155),
    tipBorder: oklch(0.35, 0.1, 155),
    warning: oklch(0.55, 0.16, 45),
    warningBg: oklch(0.22, 0.05, 45),
    warningBorder: oklch(0.4, 0.12, 45),
    danger: oklch(0.5, 0.18, 25),
    dangerBg: oklch(0.2, 0.04, 25),
    dangerBorder: oklch(0.35, 0.1, 25),
    info: oklch(0.5, 0.14, 220),
    infoBg: oklch(0.2, 0.04, 220),
    infoBorder: oklch(0.35, 0.08, 220),
    note: oklch(0.5, 0.14, 270),
    noteBg: oklch(0.2, 0.04, 270),
    noteBorder: oklch(0.35, 0.08, 270),
    badgeBlue: oklch(0.7, 0.12, 250),
    badgeBlueBg: oklch(0.22, 0.04, 250),
    badgeBlueBorder: oklch(0.35, 0.08, 250),
    badgeGreen: oklch(0.65, 0.12, 155),
    badgeGreenBg: oklch(0.22, 0.04, 155),
    badgeGreenBorder: oklch(0.35, 0.08, 155),
    badgeAmber: oklch(0.7, 0.14, 70),
    badgeAmberBg: oklch(0.22, 0.05, 70),
    badgeAmberBorder: oklch(0.38, 0.1, 70),
    badgeRed: oklch(0.7, 0.14, 25),
    badgeRedBg: oklch(0.22, 0.04, 25),
    badgeRedBorder: oklch(0.35, 0.08, 25),
    badgePurple: oklch(0.7, 0.14, 300),
    badgePurpleBg: oklch(0.22, 0.04, 300),
    badgePurpleBorder: oklch(0.35, 0.08, 300),
    badgePink: oklch(0.7, 0.14, 350),
    badgePinkBg: oklch(0.22, 0.04, 350),
    badgePinkBorder: oklch(0.35, 0.08, 350),
  }
}

/**
 * Default offset between primary and secondary hue. With the default primary
 * 356 this lands at 230 (cool slate-blue) — the documented duo-tone. Any
 * custom primary picks up an approximately complementary secondary.
 */
const DEFAULT_SECONDARY_OFFSET = 234
const DEFAULT_PRIMARY_HUE = 356

function defaultSecondary(primary: number): number {
  return (primary + DEFAULT_SECONDARY_OFFSET) % 360
}

export type ArdoBrandHues = {
  /** Main brand hue used by primary accents and calls to action. */
  primary: number
  /** Accent hue used by secondary accents and code surfaces. Defaults from the primary hue. */
  secondary?: number
  /** Neutral chrome hue used by backgrounds, borders, text, header, and sidebar. Defaults to primary. */
  neutral?: number
}

type ThemeBase = typeof shared
type ThemeColors = ReturnType<typeof createLightColors>
type ThemeHueTokens = {
  brand: string
  accent: string
  neutral: string
}

export type ArdoThemeTokens = {
  hue: ThemeHueTokens
  color: ThemeColors
} & ThemeBase

export type ArdoThemeOverrides = DeepPartial<ArdoThemeTokens>

export type ArdoThemeOptions = {
  /** Overrides applied only to the generated dark token set. */
  dark?: ArdoThemeOverrides
  /** Overrides applied only to the generated light token set. */
  light?: ArdoThemeOverrides
} & ArdoThemeOverrides &
  Partial<ArdoBrandHues>

function createBaseTheme(primary: number, secondary: number, neutral: number) {
  const hue = {
    brand: String(primary),
    accent: String(secondary),
    neutral: String(neutral),
  }

  return {
    light: {
      hue,
      color: createLightColors(),
      ...shared,
    },
    dark: {
      hue,
      color: createDarkColors(),
      ...shared,
    },
  }
}

function resolveThemeHues(
  primaryOrOptions: ArdoThemeOptions | number | undefined,
  secondaryArg?: number
): Required<ArdoBrandHues> {
  const primary =
    typeof primaryOrOptions === "number"
      ? primaryOrOptions
      : (primaryOrOptions?.primary ?? DEFAULT_PRIMARY_HUE)
  const explicitSecondary =
    typeof primaryOrOptions === "number" ? secondaryArg : primaryOrOptions?.secondary
  const secondary = explicitSecondary ?? defaultSecondary(primary)
  const neutral =
    typeof primaryOrOptions === "number" ? primary : (primaryOrOptions?.neutral ?? primary)

  return { neutral, primary, secondary }
}

function getSharedThemeOverrides(options: ArdoThemeOptions | undefined): ArdoThemeOverrides {
  if (options == null) {
    return {}
  }

  const {
    dark: _dark,
    light: _light,
    neutral: _neutral,
    primary: _primary,
    secondary: _secondary,
    ...overrides
  } = options
  return overrides
}

function mergeThemeTokens(base: ArdoThemeTokens, override: ArdoThemeOverrides): ArdoThemeTokens {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Merging over a complete token object preserves the full token shape.
  return mergeRecords(base, override) as ArdoThemeTokens
}

function mergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }

  for (const key of Object.keys(override)) {
    const value = override[key]
    if (value === undefined) {
      continue
    }

    const baseValue = base[key]
    merged[key] =
      isPlainObject(baseValue) && isPlainObject(value) ? mergeRecords(baseValue, value) : value
  }

  return merged
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function createTheme(
  primaryOrOptions?: ArdoThemeOptions | number,
  secondaryArg?: number
): { dark: ArdoThemeTokens; light: ArdoThemeTokens } {
  const { neutral, primary, secondary } = resolveThemeHues(primaryOrOptions, secondaryArg)
  const baseTheme = createBaseTheme(primary, secondary, neutral)
  const options = typeof primaryOrOptions === "object" ? primaryOrOptions : undefined
  const sharedOverrides = getSharedThemeOverrides(options)

  return {
    light: mergeThemeTokens(
      mergeThemeTokens(baseTheme.light, sharedOverrides),
      options?.light ?? {}
    ),
    dark: mergeThemeTokens(mergeThemeTokens(baseTheme.dark, sharedOverrides), options?.dark ?? {}),
  }
}

const defaultTheme = createTheme(356)
export const lightTokens = defaultTheme.light
export const darkTokens = defaultTheme.dark

export function applyBrandTheme(
  primaryOrOptions?: ArdoThemeOptions | number,
  secondaryArg?: number
) {
  const theme = createTheme(primaryOrOptions, secondaryArg)
  createGlobalTheme(":root", vars, theme.light)
  createGlobalTheme(".dark", vars, theme.dark)
}
