import type { Plugin, UserConfig } from "vite"
import type { PressConfig, ResolvedConfig } from "../config/types"
import type { TypeDocConfig } from "../typedoc/types"
import { resolveConfig } from "../config/index"
import { transformMarkdown } from "../markdown/pipeline"
import { createShikiHighlighter, type ShikiHighlighter } from "../markdown/shiki"
import { pressRoutesPlugin, type PressRoutesPluginOptions } from "./routes-plugin"
import { generateApiDocs } from "../typedoc/generator"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import fs from "fs/promises"
import fsSync from "fs"
import path from "path"
import { execSync } from "child_process"

/**
 * Finds the package root by looking for package.json in parent directories.
 * Returns the path relative to cwd, or undefined if not found.
 */
function findPackageRoot(cwd: string): string | undefined {
  let dir = path.resolve(cwd)
  const root = path.parse(dir).root

  while (dir !== root) {
    const parentDir = path.dirname(dir)
    const packageJsonPath = path.join(parentDir, "package.json")

    if (fsSync.existsSync(packageJsonPath)) {
      // Return relative path from cwd to parent
      return path.relative(cwd, parentDir) || "."
    }

    dir = parentDir
  }

  return undefined
}

/**
 * Detects the GitHub repository name from git remote URL.
 * Returns the repo name (e.g., 'ardo' from 'github.com/sebastian-software/ardo')
 * or undefined if not a GitHub repo.
 */
function detectGitHubRepoName(cwd: string): string | undefined {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()

    // Parse GitHub URL (supports both HTTPS and SSH)
    // https://github.com/user/repo.git
    // git@github.com:user/repo.git
    const match = remoteUrl.match(/github\.com[/:][\w-]+\/([\w.-]+?)(?:\.git)?$/)
    return match?.[1]
  } catch {
    return undefined
  }
}

const VIRTUAL_MODULE_ID = "virtual:ardo/config"
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID

const VIRTUAL_SIDEBAR_ID = "virtual:ardo/sidebar"
const RESOLVED_VIRTUAL_SIDEBAR_ID = "\0" + VIRTUAL_SIDEBAR_ID

const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
const RESOLVED_VIRTUAL_SEARCH_ID = "\0" + VIRTUAL_SEARCH_ID

export interface ArdoPluginOptions extends Partial<PressConfig> {
  /** Options for the routes generator plugin */
  routes?: PressRoutesPluginOptions | false
  /** Options for TanStack Start prerendering */
  prerender?: {
    enabled?: boolean
    crawlLinks?: boolean
  }
  /**
   * Auto-detect GitHub repository and set base path for GitHub Pages.
   * When true, automatically sets `base: '/repo-name/'` if deploying to GitHub Pages.
   * @default true
   */
  githubPages?: boolean
}

// Use globalThis to cache the Shiki highlighter as a true singleton across all plugin instances
const SHIKI_CACHE_KEY = "__ardo_shiki_highlighter__"
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
  const { routes, prerender, typedoc, githubPages = true, ...pressConfig } = options

  const mainPlugin: Plugin = {
    name: "ardo",
    enforce: "pre",

    config(userConfig, env): UserConfig {
      const result: UserConfig = {
        optimizeDeps: {
          exclude: ["ardo/theme/styles.css"],
        },
        ssr: {
          noExternal: ["ardo"],
        },
      }

      // Auto-detect GitHub Pages base path for production builds
      if (githubPages && env.command === "build" && !userConfig.base) {
        const repoName = detectGitHubRepoName(userConfig.root || process.cwd())
        if (repoName) {
          result.base = `/${repoName}/`
          console.log(`[ardo] GitHub Pages detected, using base: ${result.base}`)
        }
      }

      return result
    },

    async configResolved(config) {
      const root = config.root
      const defaultConfig: PressConfig = {
        title: pressConfig.title ?? "Ardo",
        description: pressConfig.description ?? "Documentation powered by Ardo",
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
      if (id === VIRTUAL_SEARCH_ID) {
        return RESOLVED_VIRTUAL_SEARCH_ID
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

      if (id === RESOLVED_VIRTUAL_SEARCH_ID) {
        const searchIndex = await generateSearchIndex(resolvedConfig)
        return `export default ${JSON.stringify(searchIndex)}`
      }
    },
  }

  const markdownPlugin: Plugin = {
    name: "ardo:markdown",
    enforce: "pre",

    async transform(code, id) {
      if (!id.endsWith(".md")) {
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
  // Note: Routes plugin must come AFTER typedoc in the array so that
  // typedoc runs first in buildStart and generates markdown files
  if (routes !== false) {
    plugins.unshift(
      pressRoutesPlugin(() => resolvedConfig, {
        srcDir: pressConfig.srcDir,
        ...routes,
      })
    )
  }

  // Add TypeDoc plugin if enabled
  // Note: unshift adds to front, so typedoc will be before routes in the array
  // This ensures typedoc buildStart runs before routes buildStart
  if (typedoc) {
    // Find package root to use as default entry point and tsconfig base
    const packageRoot = findPackageRoot(process.cwd())
    const defaultEntryPoint = packageRoot ? `${packageRoot}/src/index.ts` : "./src/index.ts"
    const defaultTsconfig = packageRoot ? `${packageRoot}/tsconfig.json` : "./tsconfig.json"

    const defaultTypedocConfig: TypeDocConfig = {
      enabled: true,
      entryPoints: [defaultEntryPoint],
      tsconfig: defaultTsconfig,
      out: "api-reference",
      excludePrivate: true,
      excludeInternal: true,
    }

    const typedocConfig: TypeDocConfig =
      typedoc === true ? defaultTypedocConfig : { ...defaultTypedocConfig, ...typedoc }

    let hasGenerated = false

    const typedocPlugin: Plugin = {
      name: "ardo:typedoc",

      async buildStart() {
        if (!hasGenerated && typedocConfig.enabled) {
          console.log("[ardo] Generating API documentation with TypeDoc...")
          const startTime = Date.now()
          try {
            const contentDir = pressConfig.srcDir ?? "./content"
            const docs = await generateApiDocs(typedocConfig, contentDir)
            const duration = Date.now() - startTime
            console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
            hasGenerated = true
          } catch (error) {
            // Don't crash the dev server if TypeDoc fails - just warn and continue
            // This allows users to run the dev server even if their TypeDoc config is incorrect
            console.warn(
              "[ardo] TypeDoc generation failed. API documentation will not be available."
            )
            console.warn("[ardo] Check your typedoc.entryPoints configuration.")
            if (error instanceof Error) {
              console.warn(`[ardo] Error: ${error.message}`)
            }
            hasGenerated = true // Prevent retry
          }
        }
      },
    }

    plugins.unshift(typedocPlugin)
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
        const indexPath = path.join(fullPath, "index.md")
        let link: string | undefined

        try {
          await fs.access(indexPath)
          // Don't include basePath - TanStack Router handles it automatically
          link = "/" + relativePath.replace(/\\/g, "/")
        } catch {
          // No index.md
        }

        items.push({
          text: formatTitle(entry.name),
          link,
          items: children,
        })
      }
    } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      const fileContent = await fs.readFile(fullPath, "utf-8")
      const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)

      let title = formatTitle(entry.name.replace(/\.md$/, ""))
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
      const link = "/" + relativePath.replace(/\.md$/, "").replace(/\\/g, "/")

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
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

interface SearchDoc {
  id: string
  title: string
  content: string
  path: string
  section?: string
}

async function generateSearchIndex(config: ResolvedConfig): Promise<SearchDoc[]> {
  const { contentDir } = config
  const docs: SearchDoc[] = []

  async function scanForSearch(dir: string, section?: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Use directory name as section for nested content
          const newSection = section
            ? `${section} > ${formatTitle(entry.name)}`
            : formatTitle(entry.name)
          await scanForSearch(fullPath, newSection)
        } else if (entry.name.endsWith(".md")) {
          const relativePath = path.relative(contentDir, fullPath)
          const fileContent = await fs.readFile(fullPath, "utf-8")

          // Extract frontmatter
          const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/)
          let title = formatTitle(entry.name.replace(/\.md$/, ""))
          let content = fileContent

          if (frontmatterMatch) {
            const frontmatterText = frontmatterMatch[1]
            const titleMatch = frontmatterText.match(/title:\s*["']?([^"'\n]+)["']?/)
            if (titleMatch) {
              title = titleMatch[1].trim()
            }
            // Remove frontmatter from content
            content = fileContent.slice(frontmatterMatch[0].length)
          }

          // Clean up content: remove markdown syntax, keep text
          content = content
            .replace(/```[\s\S]*?```/g, "") // Remove code blocks
            .replace(/`[^`]+`/g, "") // Remove inline code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links to text
            .replace(/[#*_~>]/g, "") // Remove markdown symbols
            .replace(/\n+/g, " ") // Newlines to spaces
            .replace(/\s+/g, " ") // Multiple spaces to single
            .trim()
            .slice(0, 2000) // Limit content size

          // Generate path for the route
          const routePath =
            entry.name === "index.md"
              ? "/" + path.dirname(relativePath).replace(/\\/g, "/")
              : "/" + relativePath.replace(/\.md$/, "").replace(/\\/g, "/")

          // Skip root index.md (use "/" as path)
          const finalPath = routePath === "/." ? "/" : routePath

          docs.push({
            id: relativePath,
            title,
            content,
            path: finalPath,
            section,
          })
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  await scanForSearch(contentDir)
  return docs
}

export default ardoPlugin
