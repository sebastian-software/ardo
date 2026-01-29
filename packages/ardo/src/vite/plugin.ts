import type { Plugin, UserConfig } from 'vite'
import type { PressConfig, ResolvedConfig } from '../config/types'
import { resolveConfig } from '../config/index'
import { transformMarkdown } from '../markdown/pipeline'
import { createShikiHighlighter, type ShikiHighlighter } from '../markdown/shiki'
import { pressRoutesPlugin, type PressRoutesPluginOptions } from './routes-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import path from 'path'

const VIRTUAL_MODULE_ID = 'virtual:ardo/config'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

const VIRTUAL_SIDEBAR_ID = 'virtual:ardo/sidebar'
const RESOLVED_VIRTUAL_SIDEBAR_ID = '\0' + VIRTUAL_SIDEBAR_ID

export interface ArdoPluginOptions extends Partial<PressConfig> {
  /** Options for the routes generator plugin */
  routes?: PressRoutesPluginOptions | false
  /** Options for TanStack Start prerendering */
  prerender?: {
    enabled?: boolean
    crawlLinks?: boolean
  }
}

// Use globalThis to cache the Shiki highlighter as a true singleton across all plugin instances
const SHIKI_CACHE_KEY = '__ardo_shiki_highlighter__'
let shikiHighlighterPromise: Promise<ShikiHighlighter> | null = null

function getShikiHighlighter(config: ResolvedConfig): Promise<ShikiHighlighter> {
  // Check if already cached on globalThis
  if ((globalThis as Record<string, unknown>)[SHIKI_CACHE_KEY]) {
    return Promise.resolve(
      (globalThis as Record<string, unknown>)[SHIKI_CACHE_KEY] as ShikiHighlighter
    )
  }
  // Use promise caching to prevent multiple concurrent creations
  if (!shikiHighlighterPromise) {
    shikiHighlighterPromise = createShikiHighlighter(config.markdown).then((highlighter) => {
      ;(globalThis as Record<string, unknown>)[SHIKI_CACHE_KEY] = highlighter
      return highlighter
    })
  }
  return shikiHighlighterPromise
}

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  let resolvedConfig: ResolvedConfig

  // Extract ardo-specific options from the rest (which is PressConfig)
  const { routes, prerender, ...pressConfig } = options

  const mainPlugin: Plugin = {
    name: 'ardo',
    enforce: 'pre',

    config(): UserConfig {
      return {
        optimizeDeps: {
          exclude: ['ardo/theme/styles.css'],
        },
        ssr: {
          noExternal: ['ardo'],
        },
      }
    },

    async configResolved(config) {
      const root = config.root
      const defaultConfig: PressConfig = {
        title: pressConfig.title ?? 'Ardo',
        description: pressConfig.description ?? 'Documentation powered by Ardo',
      }
      resolvedConfig = resolveConfig({ ...defaultConfig, ...pressConfig }, root)
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
      if (id === VIRTUAL_SIDEBAR_ID) {
        return RESOLVED_VIRTUAL_SIDEBAR_ID
      }
    },

    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const clientConfig = {
          title: resolvedConfig.title,
          description: resolvedConfig.description,
          base: resolvedConfig.base,
          lang: resolvedConfig.lang,
          themeConfig: resolvedConfig.themeConfig,
        }
        return `export default ${JSON.stringify(clientConfig)}`
      }

      if (id === RESOLVED_VIRTUAL_SIDEBAR_ID) {
        const sidebar = await generateSidebar(resolvedConfig)
        return `export default ${JSON.stringify(sidebar)}`
      }
    },
  }

  const markdownPlugin: Plugin = {
    name: 'ardo:markdown',
    enforce: 'pre',

    async transform(code, id) {
      if (!id.endsWith('.md')) {
        return
      }

      const highlighter = await getShikiHighlighter(resolvedConfig)

      const result = await transformMarkdown(code, resolvedConfig.markdown, {
        basePath: resolvedConfig.base,
        highlighter,
      })

      const componentCode = `
import { createElement } from 'react'

export const frontmatter = ${JSON.stringify(result.frontmatter)}
export const toc = ${JSON.stringify(result.toc)}

export default function MarkdownContent() {
  return createElement('div', {
    className: 'press-content',
    dangerouslySetInnerHTML: { __html: ${JSON.stringify(result.html)} }
  })
}
`

      return {
        code: componentCode,
        map: null,
      }
    },
  }

  const plugins: Plugin[] = [mainPlugin, markdownPlugin]

  // Add routes plugin unless explicitly disabled
  if (routes !== false) {
    plugins.unshift(
      pressRoutesPlugin(() => resolvedConfig, {
        srcDir: pressConfig.srcDir,
        ...routes,
      })
    )
  }

  // Add TanStack Start plugin
  const tanstackPlugin = tanstackStart({
    prerender: {
      enabled: prerender?.enabled ?? true,
      crawlLinks: prerender?.crawlLinks ?? false,
    },
  })
  const tanstackPlugins = (
    Array.isArray(tanstackPlugin) ? tanstackPlugin : [tanstackPlugin]
  ).filter((p): p is Plugin => p != null)
  plugins.push(...tanstackPlugins)

  // Add React plugin
  const reactPlugin = react()
  const reactPlugins = (Array.isArray(reactPlugin) ? reactPlugin : [reactPlugin]).filter(
    (p): p is Plugin => p != null
  )
  plugins.push(...reactPlugins)

  return plugins
}

async function generateSidebar(config: ResolvedConfig) {
  const { contentDir, themeConfig } = config

  if (themeConfig.sidebar && !Array.isArray(themeConfig.sidebar)) {
    return themeConfig.sidebar
  }

  if (themeConfig.sidebar && Array.isArray(themeConfig.sidebar) && themeConfig.sidebar.length > 0) {
    return themeConfig.sidebar
  }

  try {
    const sidebar = await scanDirectory(contentDir, contentDir, config.base)
    return sidebar
  } catch {
    return []
  }
}

async function scanDirectory(
  dir: string,
  rootDir: string,
  _basePath: string
): Promise<Array<{ text: string; link?: string; items?: unknown[] }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const items: Array<{ text: string; link?: string; items?: unknown[]; order?: number }> = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      const children = await scanDirectory(fullPath, rootDir, _basePath)
      if (children.length > 0) {
        const indexPath = path.join(fullPath, 'index.md')
        let link: string | undefined

        try {
          await fs.access(indexPath)
          // Don't include basePath - TanStack Router handles it automatically
          link = '/' + relativePath.replace(/\\/g, '/')
        } catch {
          // No index.md
        }

        items.push({
          text: formatTitle(entry.name),
          link,
          items: children,
        })
      }
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const fileContent = await fs.readFile(fullPath, 'utf-8')
      const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)

      let title = formatTitle(entry.name.replace(/\.md$/, ''))
      let order: number | undefined

      if (frontmatterMatch) {
        const frontmatterText = frontmatterMatch[1]
        const titleMatch = frontmatterText.match(/title:\s*["']?([^"'\n]+)["']?/)
        const orderMatch = frontmatterText.match(/order:\s*(\d+)/)

        if (titleMatch) {
          title = titleMatch[1].trim()
        }
        if (orderMatch) {
          order = parseInt(orderMatch[1], 10)
        }
      }

      // Don't include basePath - TanStack Router handles it automatically
      const link = '/' + relativePath.replace(/\.md$/, '').replace(/\\/g, '/')

      items.push({
        text: title,
        link,
        order,
      })
    }
  }

  items.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return a.text.localeCompare(b.text)
  })

  return items.map(({ order: _order, ...item }) => item)
}

function formatTitle(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default ardoPlugin
