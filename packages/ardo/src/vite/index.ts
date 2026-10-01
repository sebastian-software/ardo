// Ferriki is also exposed for code blocks authored in React components.
export { highlightCode } from "../markdown/ferriki"
// Build-time utilities (Node.js only)
export { generateSidebar, type SidebarGenerationOptions } from "../runtime/sidebar"
export {
  type CollectionDefinition,
  type CollectionEntry,
  type CollectionsConfig,
  defineCollection,
} from "./collections"
export { type ContentSourceFile, type ContentSourceMapping } from "./content-sources"

export {
  type ArdoGitHubPagesOptions,
  type ArdoVersioningOptions,
  withArdoGitHubPages,
  withArdoVersioning,
} from "./flatten-plugin"
export { type ArdoIconOptions } from "./icons"

// Vite Plugin
export { ardoPlugin as ardo, ardoPlugin, type ArdoPluginOptions } from "./plugin"
export { ardoPlugin as default } from "./plugin"
export { detectGitHubBasename } from "./plugin"

export { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"

export { generateSearchIndex, type SearchDoc } from "./search-index"
