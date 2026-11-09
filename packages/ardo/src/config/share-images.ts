/** Build-only SVG template data. Text is unescaped; escape it before inserting it in SVG. */
export type ShareImageTemplateData = {
  width: number
  height: number
  title: string
  siteTitle: string
  section: string
  locale: string
  /** Public path including deployment base, version and locale. */
  path: string
  fontFamily: string
  /** Embedded local image, suitable for an SVG image href; absent for React-element/remote logos. */
  logo?: string
  /** Raw JSX theme CSS, for templates that resolve computed token overrides themselves. */
  themeCss?: string
  /** Resolved light-theme colors, as sRGB hex strings. Custom renderers get recipe defaults for computed CSS colors. */
  colors: { background: string; text: string; brand: string; accent: string }
}

/** Opt-in build-time share cards. Nothing is rendered or loaded in development. */
export type ShareImagesConfig = {
  /** Local TTF, OTF or TTC files, relative to the project root (or absolute). Include every script used by your titles. */
  fonts: string[]
  /** Family name inside the font files, optionally a comma-separated fallback stack. */
  fontFamily: string
  /** Replace the default SVG template. Return a self-contained 1200 × 630 SVG; no external resources. */
  render?: (page: ShareImageTemplateData) => string | Promise<string>
}

export function validateShareImagesConfig(config: ShareImagesConfig | false | undefined): void {
  if (config === undefined || config === false) return
  if (
    typeof config !== "object" ||
    config === null ||
    !Array.isArray(config.fonts) ||
    config.fonts.length === 0 ||
    config.fonts.some(
      (font) =>
        typeof font !== "string" ||
        font.trim() === "" ||
        (/^[a-z]+:/iu.test(font) && !/^[a-z]:[\\/]/iu.test(font))
    ) ||
    typeof config.fontFamily !== "string" ||
    config.fontFamily.trim() === "" ||
    (config.render !== undefined && typeof config.render !== "function")
  ) {
    throw new Error(
      "[ardo] shareImages needs local fonts, a non-empty fontFamily, and an optional render function."
    )
  }
}
