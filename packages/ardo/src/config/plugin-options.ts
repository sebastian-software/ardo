import type { ArdoPluginOptions } from "../vite/plugin-options"

// The type check keeps this runtime boundary in sync when a public option is added.
const optionNames = {
  api: true,
  routes: true,
  content: true,
  collections: true,
  publication: true,
  icons: true,
  routesDir: true,
  title: true,
  description: true,
  titleSeparator: true,
  base: true,
  siteUrl: true,
  srcDir: true,
  outDir: true,
  lang: true,
  head: true,
  markdown: true,
  sidebar: true,
  metadata: true,
  seo: true,
  linkCheck: true,
  redirects: true,
  validation: true,
  versioning: true,
  i18n: true,
  openapi: true,
  vite: true,
  project: true,
  buildTime: true,
  buildHash: true,
} satisfies Record<keyof ArdoPluginOptions, true>

/** JavaScript configs and computed exports need the same spelling checks as TS literals. */
export function validateArdoOptionNames(options: ArdoPluginOptions): ArdoPluginOptions {
  if ("brand" in options) {
    throw new Error(
      "[ardo] The brand option moved into JSX. Pass colors as <ArdoRoot theme={{ color }} />, and import the logo: <ArdoRoot logo={logo} />."
    )
  }
  if ("typedoc" in options) {
    throw new Error(
      "[ardo] The typedoc option was removed. Configure api instead; see the TypeDoc migration guide."
    )
  }
  for (const name of Object.keys(options)) {
    if (Object.hasOwn(optionNames, name)) continue
    const suggestion = Object.keys(optionNames).find(
      (candidate) => candidate.toLowerCase() === name.toLowerCase()
    )
    throw new Error(
      `[ardo] Unknown configuration option ${JSON.stringify(name)}.${suggestion == null ? "" : ` Did you mean ${JSON.stringify(suggestion)}?`}`
    )
  }
  return options
}
