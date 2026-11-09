import { createColorTokens, defaultHues } from "../ui/theme/tokens"
import type { ShareImageTemplateData } from "../config/share-images"

/** Resolve the same light palette as ArdoTheme without inspecting or evaluating a root module. */
export function shareImageColors(
  css = "",
  customTemplate = false
): ShareImageTemplateData["colors"] {
  const values = new Map<string, string>()
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    if (rule[1].includes(":root.dark")) continue
    for (const declaration of rule[2].split(";")) {
      const index = declaration.indexOf(":")
      if (index !== -1)
        values.set(declaration.slice(0, index).trim(), declaration.slice(index + 1).trim())
    }
  }
  const numeric = (key: string, fallback: number) => Number(values.get(key) ?? fallback)
  const hues = Object.fromEntries(
    Object.entries(defaultHues).map(([key, value]) => [key, numeric(`--ardo-hue-${key}`, value)])
  ) as typeof defaultHues
  const colors = createColorTokens("light", hues, {
    brand: numeric("--ardo-chroma-brand", 1),
    accent: numeric("--ardo-chroma-accent", 1),
    neutral: numeric("--ardo-chroma-neutral", 1),
  })
  const color = (key: keyof typeof colors) => {
    const value = values.get(`--ardo-color-${key}`) ?? colors[key]
    try {
      return toSrgb(value)
    } catch (error) {
      if (customTemplate) return toSrgb(colors[key])
      throw error
    }
  }
  return {
    background: color("bg"),
    text: color("text"),
    brand: color("brand"),
    accent: color("accent"),
  }
}

/** resvg accepts sRGB colors; translate Ardo's concrete OKLCH recipes at this boundary. */
function toSrgb(color: string): string {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/u.exec(color)
  if (match == null) {
    if (
      /^#[\da-f]{3,8}$/iu.test(color) ||
      /^(?:rgb|hsl)a?\(/u.test(color) ||
      /^[a-z]+$/iu.test(color)
    )
      return color
    throw new Error(
      `[ardo] Share image color ${JSON.stringify(color)} needs a concrete color; use shareImages.render for CSS-variable or computed palettes.`
    )
  }
  const l = Number(match[1]),
    c = Number(match[2]),
    h = (Number(match[3]) * Math.PI) / 180
  const a = c * Math.cos(h),
    b = c * Math.sin(h)
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ]
  return `#${linear
    .map((value) => {
      const v = Math.max(0, Math.min(1, value))
      return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
        .toString(16)
        .padStart(2, "0")
    })
    .join("")}`
}
