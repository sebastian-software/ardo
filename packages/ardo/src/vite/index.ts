// Vite Plugin
export { ardoPlugin, ardoPlugin as ardo, type ArdoPluginOptions } from "./plugin"
export { ardoPlugin as default } from "./plugin"
export { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
export { detectGitHubBasename } from "./plugin"

// Build-time utilities (Node.js only)
export {
  loadDoc,
  loadAllDocs,
  getSlugFromPath,
  getPageDataForRoute,
  type LoadDocOptions,
  type LoadDocResult,
} from "../runtime/loader"

export { generateSidebar, type SidebarGenerationOptions } from "../runtime/sidebar"

// Markdown transformation
export {
  transformMarkdown,
  transformMarkdownToReact,
  type TransformResult,
} from "../markdown/pipeline"

export { createShikiHighlighter, type ShikiHighlighter } from "../markdown/shiki"
