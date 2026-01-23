// Vite Plugin
export { reactPressPlugin, type ReactPressPluginOptions } from './plugin'
export { reactPressPlugin as default } from './plugin'
export { pressRoutesPlugin, type PressRoutesPluginOptions } from './routes-plugin'

// Build-time utilities (Node.js only)
export {
  loadDoc,
  loadAllDocs,
  getSlugFromPath,
  getPageDataForRoute,
  type LoadDocOptions,
  type LoadDocResult,
} from '../runtime/loader'

export { generateSidebar, type SidebarGenerationOptions } from '../runtime/sidebar'

// Markdown transformation
export {
  transformMarkdown,
  transformMarkdownToReact,
  type TransformResult,
} from '../markdown/pipeline'

export { createShikiHighlighter, type ShikiHighlighter } from '../markdown/shiki'
