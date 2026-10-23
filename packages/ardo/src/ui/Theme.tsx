import { type ArdoThemeProps, createThemeCss } from "./theme/theme-css"

/**
 * Themes the site: brand, accent, and neutral hues, saturation, callout hues,
 * fonts, and any design token. It renders the CSS variables into a `<style>`
 * element, so the theme is in the prerendered HTML. `ArdoRoot` renders it from
 * its `theme` prop; a root built from `ArdoLayout` renders it itself.
 *
 * @example
 * ```tsx
 * <ArdoTheme color="blue" neutral="slate" fonts={{ body: '"Inter Variable", system-ui' }} />
 * ```
 */
export function ArdoTheme(props: ArdoThemeProps) {
  const css = createThemeCss(props)
  if (css === undefined) return null
  return <style data-ardo-theme dangerouslySetInnerHTML={{ __html: css }} />
}
