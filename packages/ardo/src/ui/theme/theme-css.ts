import { vars } from "./contract.css"
import { ACCENT_HUE_OFFSET, type ArdoThemeTokens } from "./tokens"

/**
 * Named hues. A preset's `chroma` applies where it sets the brand or accent;
 * `gray` also turns the neutral chrome gray.
 */
export const huePresets = {
  amber: { hue: 70 },
  berry: { hue: 356 },
  blue: { hue: 240 },
  gray: { hue: 260, chroma: 0, neutralChroma: 0 },
  green: { hue: 130 },
  indigo: { hue: 270 },
  orange: { hue: 45 },
  pink: { hue: 330 },
  purple: { hue: 290 },
  red: { hue: 25 },
  slate: { hue: 255, chroma: 0.3 },
  teal: { hue: 170 },
} satisfies Record<string, HuePreset>

type HuePreset = { hue: number; chroma?: number; neutralChroma?: number }

export type ArdoHuePreset = keyof typeof huePresets

/** A preset name or an OKLCH hue angle in degrees. */
export type ArdoHue = ArdoHuePreset | number

export type ArdoStatusHues = {
  /** Tip callouts. Default `155`, green. */
  tip?: ArdoHue
  /** Warning callouts. Default `45`, orange. */
  warning?: ArdoHue
  /** Danger and caution callouts. Default `25`, red. */
  danger?: ArdoHue
  /** Info and important callouts. Default `220`, blue. */
  info?: ArdoHue
  /** Note callouts. Default `270`, violet. */
  note?: ArdoHue
}

export type ArdoThemeProps = {
  /** Brand hue for links, buttons, focus rings, and the hero. Default `"berry"`. */
  color?: ArdoHue
  /** Accent hue for secondary highlights and code surfaces. Defaults to a complement of `color`. */
  accent?: ArdoHue
  /** Hue of backgrounds, borders, text, header, and sidebar. Defaults to `color`. */
  neutral?: ArdoHue
  /**
   * Saturation multipliers. `1` keeps Ardo's palette, `0.4` mutes it, and `0`
   * turns a role gray. A number applies to `color` and `accent`.
   */
  chroma?: number | { color?: number; accent?: number; neutral?: number }
  /** Callout hues; Ardo derives text, surface, and border for light and dark mode. */
  status?: ArdoStatusHues
  /** Font stacks. Load the fonts yourself, for example with Fontsource. */
  fonts?: { body?: string; heading?: string; mono?: string }
  /** Token values for both color schemes, such as `{ radius: { base: "0.25rem" } }`. */
  tokens?: ArdoThemeTokens
  /** Token values for light mode only. */
  light?: ArdoThemeTokens
  /** Token values for dark mode only. */
  dark?: ArdoThemeTokens
}

type ResolvedHue = { hue: number; chroma?: number; neutralChroma?: number }
type TokenTree = Record<string, Record<string, string> | string>

/**
 * The CSS for a theme: hues, chroma, fonts, and shared tokens on `:root`,
 * light and dark tokens on their own scheme. The rules are unlayered, so they
 * beat Ardo's `ardo` layer. Returns `undefined` for an empty theme.
 */
export function createThemeCss(theme: ArdoThemeProps): string | undefined {
  const css = [
    rule(":root", [
      ...brandDeclarations(theme),
      ...statusDeclarations(theme.status),
      ...fontDeclarations(theme.fonts),
      ...tokenDeclarations(theme.tokens, "tokens"),
    ]),
    rule(":root:not(.dark)", tokenDeclarations(theme.light, "light")),
    rule(":root.dark", tokenDeclarations(theme.dark, "dark")),
  ].join("")
  return css === "" ? undefined : css
}

function brandDeclarations(theme: ArdoThemeProps): string[] {
  const color = resolveHue(theme.color, "color")
  const accent =
    theme.accent === undefined
      ? color && { ...color, hue: normalizeHue(color.hue + ACCENT_HUE_OFFSET) }
      : resolveHue(theme.accent, "accent")
  const neutral = theme.neutral === undefined ? color : resolveHue(theme.neutral, "neutral")
  const chroma = resolveChroma(theme.chroma)
  return [
    declaration(vars.hue.brand, color?.hue),
    declaration(vars.hue.accent, accent?.hue),
    declaration(vars.hue.neutral, neutral?.hue),
    declaration(vars.chroma.brand, chroma.color ?? color?.chroma),
    declaration(vars.chroma.accent, chroma.accent ?? accent?.chroma),
    declaration(vars.chroma.neutral, chroma.neutral ?? neutral?.neutralChroma),
  ].filter((value) => value !== undefined)
}

function statusDeclarations(status: ArdoStatusHues | undefined): string[] {
  if (status == null) return []
  return Object.entries(status).flatMap(([key, value]) => {
    if (!Object.hasOwn(vars.hue, key) || key in vars.chroma) {
      throw new TypeError(`theme.status.${key} is not a callout type.`)
    }
    const hue = resolveHue(value, `status.${key}`)?.hue
    return declaration(vars.hue[key as keyof ArdoStatusHues], hue) ?? []
  })
}

function fontDeclarations(fonts: ArdoThemeProps["fonts"]): string[] {
  if (fonts == null) return []
  return [
    declaration(vars.font.family, cssValue(fonts.body, "fonts.body")),
    declaration(vars.font.familyHeading, cssValue(fonts.heading, "fonts.heading")),
    declaration(vars.font.mono, cssValue(fonts.mono, "fonts.mono")),
  ].filter((value) => value !== undefined)
}

function tokenDeclarations(tokens: ArdoThemeTokens | undefined, source: string): string[] {
  if (tokens == null) return []
  const contract: TokenTree = vars
  return Object.entries(tokens).flatMap(([group, values]) => {
    const groupVars = contract[group]
    if (typeof groupVars !== "object" || group === "hue" || group === "chroma") {
      throw new TypeError(`theme.${source}.${group} is not a token group.`)
    }
    return Object.entries(values ?? {}).flatMap(([key, value]) => {
      const reference = groupVars[key]
      if (reference === undefined) {
        throw new TypeError(`theme.${source}.${group}.${key} is not an Ardo token.`)
      }
      return declaration(reference, cssValue(value, `${source}.${group}.${key}`)) ?? []
    })
  })
}

function resolveHue(value: ArdoHue | undefined, path: string): ResolvedHue | undefined {
  if (value === undefined) return undefined
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`theme.${path} must be a finite hue number or a preset.`)
    }
    return { hue: normalizeHue(value) }
  }
  if (!Object.hasOwn(huePresets, value)) {
    const names = Object.keys(huePresets)
      .map((name) => `"${name}"`)
      .join(", ")
    throw new TypeError(`theme.${path} must be one of ${names} or a hue number.`)
  }
  return huePresets[value]
}

function resolveChroma(chroma: ArdoThemeProps["chroma"]) {
  const values = typeof chroma === "number" ? { color: chroma, accent: chroma } : (chroma ?? {})
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`theme.chroma.${key} must be a finite number of 0 or more.`)
    }
  }
  return values
}

/** Theme values end up in a `<style>` element, so they can't close a rule or the element. */
function cssValue(value: number | string | undefined, path: string): string | undefined {
  if (value === undefined) return undefined
  const text = String(value)
  if (/[;<>{}]/u.test(text)) {
    throw new TypeError(`theme.${path} must be a CSS value without ; { } < or >.`)
  }
  return text
}

function declaration(reference: string, value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined
  // Contract references read `var(--ardo-…)`.
  return `${reference.slice(4, -1)}:${value};`
}

function rule(selector: string, declarations: string[]): string {
  return declarations.length === 0 ? "" : `${selector}{${declarations.join("")}}`
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360
}
