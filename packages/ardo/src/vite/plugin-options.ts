import type { NativeApiDocsConfig } from "../api/types"
import type { ArdoConfig } from "../config/types"
import type { CollectionsConfig } from "./collections"
import type { ContentSourceMapping } from "./content-sources"
import type { ArdoIconOptions } from "./icons"
import type { ArdoRoutesPluginOptions } from "./routes-plugin"

export type PressConfigOptions = Omit<
  ArdoPluginOptions,
  "api" | "collections" | "content" | "githubPages" | "icons" | "routes" | "routesDir" | "typedoc"
>

export type ArdoPluginOptions = {
  /** Generate source API documentation using the native TypeScript 7.1 API. */
  api?: NativeApiDocsConfig | true
  /** Options for the routes generator plugin */
  routes?: ArdoRoutesPluginOptions | false
  /**
   * Materialize Markdown/MDX files from outside the routes directory into
   * generated route files. This is a narrow bridge until schema-backed content
   * collections land.
   */
  content?: ContentSourceMapping[]
  /** Schema-backed local Markdown/MDX collections that also materialize into routes. */
  collections?: CollectionsConfig
  /**
   * Generate the lean favicon set recommended for modern websites:
   * /favicon.ico, /icon.svg, and /apple-touch-icon.png.
   *
   * @default true
   */
  icons?: ArdoIconOptions
  /**
   * Auto-detect GitHub repository and set base path for GitHub Pages.
   * @default true
   */
  githubPages?: boolean
  /**
   * Directory where routes are located.
   * @default "./app/routes"
   */
  routesDir?: string
} & Partial<ArdoConfig>
