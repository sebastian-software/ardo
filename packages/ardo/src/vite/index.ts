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
export { createArdoProjectViteConfig } from "./project-config"

export { generateSearchIndex, type SearchDoc } from "./search-index"

export { defaultShareImage, escapeShareImageText } from "./share-image-template"
export type { ShareImagesConfig, ShareImageTemplateData } from "../config/share-images"

// Vite Plugin
export { defineConfig, type Plugin, type UserConfig } from "vite"
