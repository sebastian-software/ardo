import type { ShareImageTemplateData } from "../config/share-images"

/** XML escaping for template text and attributes. */
export function escapeShareImageText(value: string): string {
  return value.replaceAll(
    /[&<>"']/gu,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char
  )
}

/** Self-contained SVG; resvg shapes the configured fonts, including RTL and fallback scripts. */
export function defaultShareImage(page: ShareImageTemplateData): string {
  const { colors, width, height } = page
  const text = escapeShareImageText
  const lines = wrapTitle(page.title, page.locale)
  const size = lines.length > 3 ? 52 : 64
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="1200" height="630" fill="${colors.background}"/>
<rect width="14" height="630" fill="${colors.brand}"/>
<circle cx="1150" cy="620" r="260" fill="${colors.accent}" opacity="0.08"/>
${page.logo == null ? "" : `<image href="${text(page.logo)}" x="70" y="55" width="88" height="88" preserveAspectRatio="xMidYMid meet"/>`}
<g font-family="${text(page.fontFamily)}">
<text x="${page.logo == null ? 72 : 184}" y="110" font-size="30" fill="${colors.text}">${text(page.siteTitle)}</text>
<text x="72" y="205" font-size="22" fill="${colors.brand}">${text(page.section)}</text>
<text x="72" y="285" font-size="${size}" font-weight="700" fill="${colors.text}">${lines.map((line, i) => `<tspan x="72" dy="${i === 0 ? 0 : size * 1.22}">${text(line)}</tspan>`).join("")}</text>
</g></svg>`
}

function wrapTitle(title: string, locale: string): string[] {
  const words = [...titleSegmenter(locale).segment(title)].flatMap(({ segment }) =>
    textUnits(segment) > 16 ? [...segment] : [segment]
  )
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    if (textUnits(line + word) > 16 && line.trim() !== "") {
      lines.push(line.trim())
      line = ""
    }
    line += word
  }
  if (line.trim() !== "") lines.push(line.trim())
  if (lines.length > 5) return [...lines.slice(0, 4), `${lines[4].slice(0, -1)}…`]
  return lines
}

function textUnits(text: string): number {
  return [...text].reduce(
    (units, char) =>
      units +
      ((char.codePointAt(0) ?? 0) > 591
        ? 1.7
        : /[MW@]/u.test(char)
          ? 1.2
          : /[il.,' ]/u.test(char)
            ? 0.35
            : 0.65),
    0
  )
}

/** Locale directory IDs need not be BCP 47 tags. Keep segmentation deterministic for those IDs. */
function titleSegmenter(locale: string): Intl.Segmenter {
  try {
    return new Intl.Segmenter(locale, { granularity: "word" })
  } catch {
    return new Intl.Segmenter("en", { granularity: "word" })
  }
}
