// Markdown transformation
export {
  transformMarkdown,
  transformMarkdownToReact,
  type TransformResult,
} from "../markdown/pipeline"
export { createShikiHighlighter, highlightCode, type ShikiHighlighter } from "../markdown/shiki"
// Build-time utilities (Node.js only)
export {
  getPageDataForRoute,
  getSlugFromPath,
  loadAllDocs,
  loadDoc,
  type LoadDocOptions,
  type LoadDocResult,
} from "../runtime/loader"
export { generateSidebar, type SidebarGenerationOptions } from "../runtime/sidebar"

// Vite Plugin
export { ardoPlugin as ardo, ardoPlugin, type ArdoPluginOptions } from "./plugin"

export { ardoPlugin as default } from "./plugin"

export { detectGitHubBasename } from "./plugin"

export { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"
