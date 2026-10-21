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

export { type ArdoIconOptions } from "./icons"

export { ardoPlugin as ardo, ardoPlugin, type ArdoPluginOptions } from "./plugin"
export { ardoPlugin as default } from "./plugin"
export { detectGitHubBasename } from "./plugin"
export { createArdoProjectViteConfig } from "./project-config"

export { generateSearchIndex, type SearchDoc } from "./search-index"

// Vite Plugin
export { defineConfig, type UserConfig } from "vite"
