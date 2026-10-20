import { describe, expect, it } from "vitest"

import { brandHuePresets } from "../../config/brand"
import { type ColorChroma, createColorTokens } from "./tokens"

type Rgb = [number, number, number]

const clip = (value: number) => Math.min(1, Math.max(0, value))

/** OKLCH to linear sRGB, clipped to the sRGB gamut like browsers do. */
function oklchToLinearSrgb(l: number, c: number, h: number): Rgb {
  const radians = (h * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)
  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    clip(4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone),
    clip(-1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone),
    clip(-0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone),
  ]
}

function luminance(color: string): number {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(color)
  if (match === null) throw new Error(`Not a plain oklch() color: ${color}`)
  const [r, g, b] = oklchToLinearSrgb(Number(match[1]), Number(match[2]), Number(match[3]))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

// Text on surface pairs the default theme renders. [foreground, background, minimum]
const TEXT_PAIRS = [
  ["text", "bg", 4.5],
  ["textLight", "bg", 4.5],
  ["textLighter", "bg", 4.5],
  ["textLight", "sidebarBg", 4.5],
  ["textLighter", "codeBg", 4.5],
  ["text", "codeBg", 4.5],
  ["brand", "bg", 4.5],
  ["brand", "sidebarBg", 4.5],
  ["brandInk", "brand", 4.5],
  ["accent", "bg", 4.5],
  ["tip", "tipBg", 4.5],
  ["warning", "warningBg", 4.5],
  ["danger", "dangerBg", 4.5],
  ["info", "infoBg", 4.5],
  ["note", "noteBg", 4.5],
] as const

const CHROMA_LEVELS: Record<string, ColorChroma> = {
  default: { brand: 1, accent: 1, neutral: 1 },
  muted: { brand: 0.4, accent: 0.4, neutral: 0.5 },
  // Brand chroma above 1 pushes hues such as teal out of sRGB, so only the
  // accent and neutral get a boost here; see the chroma docs.
  boosted: { brand: 1, accent: 2, neutral: 2 },
}

describe("default theme contrast", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const [level, chroma] of Object.entries(CHROMA_LEVELS)) {
      it(`meets WCAG AA for every hue preset in ${mode} mode (${level} chroma)`, () => {
        const failures: string[] = []
        for (const [preset, hue] of Object.entries(brandHuePresets)) {
          const colors = createColorTokens(
            mode,
            { brand: hue, accent: (hue + 234) % 360, neutral: hue },
            chroma
          )
          for (const [foreground, background, minimum] of TEXT_PAIRS) {
            const ratio = contrast(colors[foreground], colors[background])
            if (ratio < minimum) {
              failures.push(`${preset}: ${foreground} on ${background} ${ratio.toFixed(2)}:1`)
            }
          }
        }
        expect(failures).toStrictEqual([])
      })
    }
  }
})
