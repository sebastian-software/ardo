/* eslint-disable max-lines -- This file intentionally keeps the generated token table together. */
/**
 * Pre-computed OKLCH color values for both light and dark themes.
 * No more `calc(var(...))` chains — all values are resolved here.
 */

import { createGlobalTheme } from "@vanilla-extract/css"

import { vars } from "./contract.css"

type HueValue = number | string
type ChromaValue = number | string
type PrimitiveToken = number | string
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends PrimitiveToken ? T[K] : DeepPartial<T[K]>
}

/** Hues the color recipes read: CSS variables at runtime, plain numbers in tests. */
export type ColorHues = { brand: HueValue; accent: HueValue; neutral: HueValue }
/** Chroma multipliers the color recipes read: 1 keeps the designed saturation. */
export type ColorChroma = { brand: ChromaValue; accent: ChromaValue; neutral: ChromaValue }

const varHues: ColorHues = vars.hue
const varChroma: ColorChroma = vars.chroma

// eslint-disable-next-line max-params -- mirrors CSS oklch() syntax
const oklch = (l: number, c: ChromaValue, h: HueValue, alpha?: number) =>
  alpha !== undefined ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`

function hueOffset(hue: HueValue, offset: number): HueValue {
  return typeof hue === "number" ? hue + offset : `calc(${hue} + ${offset})`
}

function scaleChroma(value: number, multiplier: ChromaValue): ChromaValue {
  return typeof multiplier === "number"
    ? Number((value * multiplier).toFixed(4))
    : `calc(${value} * ${multiplier})`
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
    // About 75–80 characters per line. `em` follows each element's own font
    // size, so a larger lead or smaller note keeps the same measure. `ch`
    // measures the wide "0" glyph, so 68ch let system-ui prose run past 90.
    contentMaxWidth: "36em",
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
    lineHeight: "1.65",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
    "4xl": "2.5rem",
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
    xl: "1rem",
    full: "999px",
  },
}

function createLightColors(hues: ColorHues = varHues, chroma: ColorChroma = varChroma) {
  const { brand: primary, accent: secondary, neutral } = hues
  const b = (value: number) => scaleChroma(value, chroma.brand)
  const a = (value: number) => scaleChroma(value, chroma.accent)
  const n = (value: number) => scaleChroma(value, chroma.neutral)
  return {
    brand: oklch(0.48, b(0.185), primary),
    brandLight: oklch(0.64, b(0.16), primary),
    brandDark: oklch(0.42, b(0.175), primary),
    brandSubtle: oklch(0.955, b(0.04), primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.48, b(0.19), primary)} 0%, ${oklch(0.52, b(0.16), hueOffset(primary, 18))} 100%)`,
    brandInk: oklch(0.99, b(0.01), primary),
    ring: oklch(0.48, b(0.185), primary, 0.38),
    accent: oklch(0.5, a(0.075), secondary),
    accentLight: oklch(0.62, a(0.07), secondary),
    accentDark: oklch(0.38, a(0.085), secondary),
    accentSubtle: oklch(0.963, a(0.012), secondary),
    bg: oklch(0.992, n(0.0015), neutral),
    bgSoft: oklch(0.975, n(0.003), neutral),
    bgMute: oklch(0.955, n(0.004), neutral),
    bgAlt: oklch(0.935, n(0.005), neutral),
    text: oklch(0.17, n(0.008), neutral),
    textLight: oklch(0.4, n(0.007), neutral),
    textLighter: oklch(0.47, n(0.006), neutral),
    border: oklch(0.88, n(0.005), neutral),
    borderLight: oklch(0.925, n(0.003), neutral),
    divider: oklch(0.89, n(0.004), neutral),
    sidebarBg: oklch(0.965, n(0.004), neutral),
    sidebarRailBg: oklch(0.94, n(0.005), neutral),
    sidebarBorder: oklch(0.885, n(0.005), neutral),
    // Code surfaces take the accent hue but stay as quiet as the chrome, so a
    // boosted accent does not tint every code block.
    codeBg: oklch(0.965, n(0.012), secondary),
    codeBorder: oklch(0.88, n(0.016), secondary),
    codeShadow: `0 1px 2px ${oklch(0.2, n(0.015), neutral, 0.03)}, 0 6px 16px -8px ${oklch(0.2, n(0.015), neutral, 0.07)}`,
    shadowSm: `0 1px 2px ${oklch(0.2, n(0.015), neutral, 0.05)}, 0 2px 8px -2px ${oklch(0.2, n(0.015), neutral, 0.05)}`,
    shadowMd: `0 2px 4px ${oklch(0.2, n(0.015), neutral, 0.04)}, 0 10px 24px -6px ${oklch(0.2, n(0.015), neutral, 0.09)}`,
    shadowLg: `0 4px 10px ${oklch(0.2, n(0.015), neutral, 0.05)}, 0 24px 56px -12px ${oklch(0.2, n(0.02), neutral, 0.16)}`,
    surfaceCard: `linear-gradient(180deg, ${oklch(0.998, n(0.001), neutral)} 0%, ${oklch(0.982, n(0.003), neutral)} 100%)`,
    surfaceInset: `inset 0 1px 0 oklch(1 0 0 / 0.9)`,
    headerBg: oklch(0.992, n(0.0015), neutral, 0.82),
    heroWash: `radial-gradient(90rem 42rem at 50% -12rem, ${oklch(0.92, b(0.06), primary, 0.6)} 0%, transparent 62%), radial-gradient(64rem 36rem at 84% -8rem, ${oklch(0.93, a(0.035), secondary, 0.45)} 0%, transparent 58%), linear-gradient(180deg, ${oklch(0.978, n(0.003), neutral)} 0%, ${oklch(0.992, n(0.0015), neutral)} 100%)`,
    heroGrid: `radial-gradient(circle at 1px 1px, ${oklch(0.55, b(0.06), primary, 0.18)} 1px, transparent 1.5px)`,
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

function createDarkColors(hues: ColorHues = varHues, chroma: ColorChroma = varChroma) {
  const { brand: primary, accent: secondary, neutral } = hues
  const b = (value: number) => scaleChroma(value, chroma.brand)
  const a = (value: number) => scaleChroma(value, chroma.accent)
  const n = (value: number) => scaleChroma(value, chroma.neutral)
  return {
    brand: oklch(0.72, b(0.17), primary),
    brandLight: oklch(0.82, b(0.14), primary),
    brandDark: oklch(0.6, b(0.18), primary),
    brandSubtle: oklch(0.29, b(0.09), primary),
    brandGradient: `linear-gradient(135deg, ${oklch(0.72, b(0.17), primary)} 0%, ${oklch(0.79, b(0.13), hueOffset(primary, 18))} 100%)`,
    brandInk: oklch(0.16, b(0.055), primary),
    ring: oklch(0.72, b(0.17), primary, 0.5),
    accent: oklch(0.74, a(0.08), secondary),
    accentLight: oklch(0.84, a(0.07), secondary),
    accentDark: oklch(0.6, a(0.09), secondary),
    accentSubtle: oklch(0.26, a(0.03), secondary),
    bg: oklch(0.155, n(0.008), neutral),
    bgSoft: oklch(0.195, n(0.009), neutral),
    bgMute: oklch(0.255, n(0.01), neutral),
    bgAlt: oklch(0.33, n(0.01), neutral),
    text: oklch(0.94, n(0.004), neutral),
    textLight: oklch(0.72, n(0.007), neutral),
    textLighter: oklch(0.68, n(0.007), neutral),
    border: oklch(0.285, n(0.011), neutral),
    borderLight: oklch(0.35, n(0.01), neutral),
    divider: oklch(0.29, n(0.01), neutral),
    sidebarBg: oklch(0.13, n(0.008), neutral),
    sidebarRailBg: oklch(0.105, n(0.008), neutral),
    sidebarBorder: oklch(0.265, n(0.011), neutral),
    codeBg: oklch(0.21, n(0.016), secondary),
    codeBorder: oklch(0.33, n(0.024), secondary),
    codeShadow: "0 2px 6px oklch(0 0 0 / 0.14), 0 12px 28px -10px oklch(0 0 0 / 0.28)",
    shadowSm: "0 1px 2px oklch(0 0 0 / 0.22), 0 2px 8px -2px oklch(0 0 0 / 0.26)",
    shadowMd: "0 2px 6px oklch(0 0 0 / 0.22), 0 12px 28px -8px oklch(0 0 0 / 0.38)",
    shadowLg: "0 6px 16px oklch(0 0 0 / 0.26), 0 32px 72px -16px oklch(0 0 0 / 0.5)",
    surfaceCard: `linear-gradient(180deg, ${oklch(0.215, n(0.009), neutral)} 0%, ${oklch(0.185, n(0.009), neutral)} 100%)`,
    surfaceInset: `inset 0 1px 0 oklch(1 0 0 / 0.06)`,
    headerBg: oklch(0.155, n(0.008), neutral, 0.8),
    heroWash: `radial-gradient(90rem 42rem at 50% -12rem, ${oklch(0.36, b(0.09), primary, 0.55)} 0%, transparent 62%), radial-gradient(64rem 36rem at 84% -8rem, ${oklch(0.31, a(0.055), secondary, 0.45)} 0%, transparent 58%), linear-gradient(180deg, ${oklch(0.175, n(0.01), neutral)} 0%, ${oklch(0.155, n(0.008), neutral)} 100%)`,
    heroGrid: `radial-gradient(circle at 1px 1px, ${oklch(0.78, b(0.08), primary, 0.16)} 1px, transparent 1.5px)`,
    tip: oklch(0.78, 0.13, 155),
    tipBg: oklch(0.2, 0.04, 155),
    tipBorder: oklch(0.35, 0.1, 155),
    warning: oklch(0.8, 0.12, 60),
    warningBg: oklch(0.22, 0.05, 45),
    warningBorder: oklch(0.4, 0.12, 45),
    danger: oklch(0.76, 0.13, 25),
    dangerBg: oklch(0.2, 0.04, 25),
    dangerBorder: oklch(0.35, 0.1, 25),
    info: oklch(0.78, 0.1, 220),
    infoBg: oklch(0.2, 0.04, 220),
    infoBorder: oklch(0.35, 0.08, 220),
    note: oklch(0.78, 0.1, 270),
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

/**
 * Chroma multipliers for the hue-derived colors. `1` keeps Ardo's designed
 * saturation, `0.4` gives a muted palette and `0` turns a hue into pure gray.
 * A single number applies to brand and accent; neutral keeps its own default.
 */
export type ArdoThemeChroma =
  | {
      /** Multiplier for the brand colors. */
      brand?: number
      /** Multiplier for the accent colors and code surfaces. */
      accent?: number
      /** Multiplier for backgrounds, borders, text, header, and sidebar. */
      neutral?: number
    }
  | number

type ThemeBase = typeof shared
type ThemeColors = ReturnType<typeof createLightColors>
type ThemeChannelTokens = {
  brand: string
  accent: string
  neutral: string
}

export type ArdoThemeTokens = {
  hue: ThemeChannelTokens
  chroma: ThemeChannelTokens
  color: ThemeColors
} & ThemeBase

export type ArdoThemeOverrides = DeepPartial<ArdoThemeTokens>

export type ArdoThemeOptions = {
  /** Overrides applied only to the generated dark token set. */
  dark?: ArdoThemeOverrides
  /** Overrides applied only to the generated light token set. */
  light?: ArdoThemeOverrides
  /** Saturation of the hue-derived colors; see {@link ArdoThemeChroma}. */
  chroma?: ArdoThemeChroma
} & Omit<ArdoThemeOverrides, "chroma"> &
  Partial<ArdoBrandHues>

export function resolveChroma(chroma: ArdoThemeChroma | undefined): ThemeChannelTokens {
  const values = typeof chroma === "number" ? { brand: chroma, accent: chroma } : (chroma ?? {})
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`chroma.${key} must be a finite number of 0 or more.`)
    }
  }
  return {
    brand: String(values.brand ?? 1),
    accent: String(values.accent ?? 1),
    neutral: String(values.neutral ?? 1),
  }
}

function createBaseTheme(
  { primary, secondary, neutral }: Required<ArdoBrandHues>,
  chroma: ThemeChannelTokens
) {
  const hue = {
    brand: String(primary),
    accent: String(secondary),
    neutral: String(neutral),
  }

  return {
    light: {
      hue,
      chroma,
      color: createLightColors(),
      ...shared,
    },
    dark: {
      hue,
      chroma,
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
    chroma: _chroma,
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
  const options = typeof primaryOrOptions === "object" ? primaryOrOptions : undefined
  const baseTheme = createBaseTheme(
    resolveThemeHues(primaryOrOptions, secondaryArg),
    resolveChroma(options?.chroma)
  )
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

/**
 * Resolves the color recipes with concrete hues and chroma multipliers instead
 * of CSS variables, so tests can measure the colors a site actually gets.
 */
export function createColorTokens(
  mode: "dark" | "light",
  hues: ColorHues,
  chroma: ColorChroma = { brand: 1, accent: 1, neutral: 1 }
): ThemeColors {
  return mode === "light" ? createLightColors(hues, chroma) : createDarkColors(hues, chroma)
}
