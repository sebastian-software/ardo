import type { Plugin, UserConfig } from "vite"
import type { PressConfig, ProjectMeta, ResolvedConfig } from "../config/types"
import type { TypeDocConfig } from "../typedoc/types"
import { resolveConfig } from "../config/index"
import { generateApiDocs } from "../typedoc/generator"
import { reactRouter } from "@react-router/dev/vite"
import mdx from "@mdx-js/rollup"
import remarkFrontmatter from "remark-frontmatter"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import remarkGfm from "remark-gfm"
import remarkDirective from "remark-directive"
import rehypeShiki from "@shikijs/rehype"
import { ardoLineTransformer, remarkCodeMeta } from "../markdown/shiki"
import { remarkContainersMdx } from "../markdown/containers"
import fs from "fs/promises"
import fsSync from "fs"
import path from "path"
import { execSync } from "child_process"
import matter from "gray-matter"
import { ardoRoutesPlugin, type ArdoRoutesPluginOptions } from "./routes-plugin"

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

/**
 * Reads project metadata from the nearest package.json.
 */
function readProjectMeta(root: string): ProjectMeta {
  const pkgPath = path.join(root, "package.json")
  try {
    const raw = fsSync.readFileSync(pkgPath, "utf-8")
    const pkg = JSON.parse(raw)

    let repository: string | undefined
    if (typeof pkg.repository === "string") {
      repository = pkg.repository
    } else if (pkg.repository?.url) {
      // Normalize git+https://... or git://... URLs
      repository = pkg.repository.url
        .replace(/^git\+/, "")
        .replace(/^git:\/\//, "https://")
        .replace(/\.git$/, "")
    }

    let author: string | undefined
    if (typeof pkg.author === "string") {
      author = pkg.author
    } else if (pkg.author?.name) {
      author = pkg.author.name
    }

    return {
      name: pkg.name,
      homepage: pkg.homepage,
      repository,
      version: pkg.version,
      author,
      license: pkg.license,
    }
  } catch {
    return {}
  }
}

/**
 * Recursively copies files from src to dest, overwriting existing files.
 */
function copyRecursive(src: string, dest: string) {
  const stat = fsSync.statSync(src)

  if (stat.isDirectory()) {
    if (!fsSync.existsSync(dest)) {
      fsSync.mkdirSync(dest, { recursive: true })
    }
    for (const item of fsSync.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item))
    }
  } else {
    fsSync.copyFileSync(src, dest)
  }
}

/**
 * Detects the GitHub Pages basename from the git remote URL.
 * Returns `"/repo-name/"` if a GitHub repo is detected, otherwise `undefined`.
 *
 * Use this in `react-router.config.ts` to synchronize client-side routing
 * with the Vite `base` path that Ardo auto-detects:
 *
 * ```ts
 * import { detectGitHubBasename } from "ardo/vite"
 *
 * export default {
 *   ssr: false,
 *   prerender: true,
 *   basename: detectGitHubBasename(),
 * } satisfies Config
 * ```
 */
export function detectGitHubBasename(cwd?: string): string {
  if (process.env.NODE_ENV !== "production") {
    return "/"
  }
  const repoName = detectGitHubRepoName(cwd || process.cwd())
  return repoName ? `/${repoName}/` : "/"
}

const VIRTUAL_MODULE_ID = "virtual:ardo/config"
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID

const VIRTUAL_SIDEBAR_ID = "virtual:ardo/sidebar"
const RESOLVED_VIRTUAL_SIDEBAR_ID = "\0" + VIRTUAL_SIDEBAR_ID

const VIRTUAL_SEARCH_ID = "virtual:ardo/search-index"
const RESOLVED_VIRTUAL_SEARCH_ID = "\0" + VIRTUAL_SEARCH_ID

// Module-level flags to prevent duplicate operations across plugin instances
// This is necessary because React Router creates multiple Vite instances
let typedocGenerated = false
let flattenExecuted = false

export interface ArdoPluginOptions extends Partial<PressConfig> {
  /** Options for the routes generator plugin */
  routes?: ArdoRoutesPluginOptions | false
  /**
   * Auto-detect GitHub repository and set base path for GitHub Pages.
   * When true, automatically sets `base: '/repo-name/'` if deploying to GitHub Pages.
   * @default true
   */
  githubPages?: boolean
  /**
   * Directory where routes are located.
   * @default "./app/routes"
   */
  routesDir?: string
}

export function ardoPlugin(options: ArdoPluginOptions = {}): Plugin[] {
  let resolvedConfig: ResolvedConfig
  let routesDir: string

  // Extract ardo-specific options from the rest (which is PressConfig)
  const {
    routes,
    typedoc,
    githubPages = true,
    routesDir: routesDirOption,
    ...pressConfig
  } = options

  const mainPlugin: Plugin = {
    name: "ardo",
    enforce: "pre",

    config(userConfig, env): UserConfig {
      const root = userConfig.root || process.cwd()
      routesDir = routesDirOption || path.join(root, "app", "routes")

      const result: UserConfig = {
        optimizeDeps: {
          exclude: ["ardo/ui/styles.css"],
        },
        ssr: {
          noExternal: ["ardo"],
        },
      }

      // Auto-detect GitHub Pages base path for production builds
      if (githubPages && env.command === "build" && !userConfig.base) {
        const repoName = detectGitHubRepoName(root)
        if (repoName) {
          result.base = `/${repoName}/`
          console.log(`[ardo] GitHub Pages detected, using base: ${result.base}`)
        }
      }

      return result
    },

    async configResolved(config) {
      const root = config.root
      routesDir = routesDirOption || path.join(root, "app", "routes")

      // Auto-detect project metadata from package.json
      const detectedProject = readProjectMeta(root)
      const project: ProjectMeta = { ...detectedProject, ...pressConfig.project }

      const defaultConfig: PressConfig = {
        title: pressConfig.title ?? "Ardo",
        description: pressConfig.description ?? "Documentation powered by Ardo",
      }

      // For React Router, contentDir is the routes directory
      const configWithRoutes = {
        ...defaultConfig,
        ...pressConfig,
        project,
        srcDir: routesDir,
      }

      resolvedConfig = resolveConfig(configWithRoutes, root)
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
          project: resolvedConfig.project,
        }
        return `export default ${JSON.stringify(clientConfig)}`
      }

      if (id === RESOLVED_VIRTUAL_SIDEBAR_ID) {
        const sidebar = await generateSidebar(resolvedConfig, routesDir)
        return `export default ${JSON.stringify(sidebar)}`
      }

      if (id === RESOLVED_VIRTUAL_SEARCH_ID) {
        const searchIndex = await generateSearchIndex(routesDir)
        return `export default ${JSON.stringify(searchIndex)}`
      }
    },
  }

  const plugins: Plugin[] = [mainPlugin]

  // Add routes plugin unless explicitly disabled
  if (routes !== false) {
    plugins.push(
      ardoRoutesPlugin({
        routesDir: routesDirOption,
        ...routes,
      })
    )
  }

  // Add TypeDoc plugin if enabled
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

    const typedocPlugin: Plugin = {
      name: "ardo:typedoc",

      async buildStart() {
        // Use module-level flag to prevent duplicate generation across plugin instances
        if (typedocGenerated || !typedocConfig.enabled) {
          return
        }

        console.log("[ardo] Generating API documentation with TypeDoc...")
        const startTime = Date.now()
        try {
          const outputDir = routesDirOption || "./app/routes"
          const docs = await generateApiDocs(typedocConfig, outputDir)
          const duration = Date.now() - startTime
          console.log(`[ardo] Generated ${docs.length} API documentation pages in ${duration}ms`)
        } catch (error) {
          console.warn("[ardo] TypeDoc generation failed. API documentation will not be available.")
          console.warn("[ardo] Check your typedoc.entryPoints configuration.")
          if (error instanceof Error) {
            console.warn(`[ardo] Error: ${error.message}`)
          }
        }
        typedocGenerated = true
      },
    }

    plugins.unshift(typedocPlugin)
  }

  // Add MDX plugin with Ardo's markdown pipeline
  const themeConfig = pressConfig.markdown?.theme
  const hasThemeObject = themeConfig && typeof themeConfig === "object" && "light" in themeConfig
  const lineNumbers = pressConfig.markdown?.lineNumbers || false

  // Build shiki options with Ardo's custom line transformer
  const shikiOptions = hasThemeObject
    ? {
        themes: {
          light: themeConfig.light || "github-light",
          dark: themeConfig.dark || "github-dark",
        },
        defaultColor: false as const,
        transformers: [ardoLineTransformer({ globalLineNumbers: lineNumbers })],
      }
    : {
        theme: (themeConfig as string) || "github-dark",
        transformers: [ardoLineTransformer({ globalLineNumbers: lineNumbers })],
      }

  const mdxPlugin = mdx({
    include: /\.(md|mdx)$/,
    remarkPlugins: [
      remarkFrontmatter,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
      remarkGfm,
      remarkDirective,
      remarkContainersMdx,
      remarkCodeMeta,
    ],
    rehypePlugins: [[rehypeShiki, shikiOptions]],
    providerImportSource: "ardo/mdx-provider",
  })
  plugins.push(mdxPlugin as Plugin)

  // Add React Router Framework plugin (includes React plugin internally)
  const reactRouterPlugin = reactRouter()
  const reactRouterPlugins = (
    Array.isArray(reactRouterPlugin) ? reactRouterPlugin : [reactRouterPlugin]
  ).filter((p): p is Plugin => p != null)
  plugins.push(...reactRouterPlugins)

  // Add flatten plugin for GitHub Pages (must run after React Router build)
  if (githubPages) {
    let detectedBase: string | undefined

    const flattenPlugin: Plugin = {
      name: "ardo:flatten-github-pages",
      enforce: "post",

      configResolved(config) {
        if (config.base && config.base !== "/") {
          detectedBase = config.base
        }
      },

      closeBundle() {
        if (flattenExecuted || !detectedBase) {
          return
        }

        // Strip leading/trailing slashes to get the directory name
        const baseName = detectedBase.replace(/^\/|\/$/g, "")
        if (!baseName) return

        const buildDir = path.join(process.cwd(), "build", "client")
        const nestedDir = path.join(buildDir, baseName)

        if (!fsSync.existsSync(nestedDir)) {
          return
        }

        console.log(`[ardo] Flattening build/client/${baseName}/ to build/client/ for GitHub Pages`)
        copyRecursive(nestedDir, buildDir)
        fsSync.rmSync(nestedDir, { recursive: true, force: true })
        console.log("[ardo] Build output flattened successfully.")

        flattenExecuted = true
      },
    }

    plugins.push(flattenPlugin)
  }

  return plugins
}

async function generateSidebar(config: ResolvedConfig, routesDir: string) {
  const { themeConfig } = config

  if (themeConfig.sidebar && !Array.isArray(themeConfig.sidebar)) {
    return themeConfig.sidebar
  }

  if (themeConfig.sidebar && Array.isArray(themeConfig.sidebar) && themeConfig.sidebar.length > 0) {
    return themeConfig.sidebar
  }

  try {
    const sidebar = await scanDirectory(routesDir, routesDir)
    return sidebar
  } catch {
    return []
  }
}

async function scanDirectory(
  dir: string,
  rootDir: string
): Promise<Array<{ text: string; link?: string; items?: unknown[] }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const items: Array<{ text: string; link?: string; items?: unknown[]; order?: number }> = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(rootDir, fullPath)

    if (entry.isDirectory()) {
      const children = await scanDirectory(fullPath, rootDir)
      if (children.length > 0) {
        // Check for index.mdx in the directory
        const indexPath = path.join(fullPath, "index.mdx")
        let link: string | undefined

        try {
          await fs.access(indexPath)
          link = "/" + relativePath.replace(/\\/g, "/")
        } catch {
          // No index.mdx
        }

        items.push({
          text: formatTitle(entry.name),
          link,
          items: children,
        })
      }
    } else if (
      (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) &&
      entry.name !== "index.mdx" &&
      entry.name !== "index.md"
    ) {
      const fileContent = await fs.readFile(fullPath, "utf-8")
      const { data: frontmatter } = matter(fileContent)

      const ext = entry.name.endsWith(".mdx") ? ".mdx" : ".md"
      const title = frontmatter.title || formatTitle(entry.name.replace(ext, ""))
      const order: number | undefined =
        typeof frontmatter.order === "number" ? frontmatter.order : undefined

      const link = "/" + relativePath.replace(ext, "").replace(/\\/g, "/")

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

async function generateSearchIndex(routesDir: string): Promise<SearchDoc[]> {
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
        } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
          const relativePath = path.relative(routesDir, fullPath)
          const fileContent = await fs.readFile(fullPath, "utf-8")

          // Extract frontmatter
          const { data: frontmatter, content: rawContent } = matter(fileContent)
          const ext = entry.name.endsWith(".mdx") ? ".mdx" : ".md"
          const title = frontmatter.title || formatTitle(entry.name.replace(ext, ""))
          let content = rawContent

          // Clean up content: remove markdown/MDX syntax, keep text
          content = content
            .replace(/```[\s\S]*?```/g, "") // Remove code blocks
            .replace(/`[^`]+`/g, "") // Remove inline code
            .replace(/import\s+.*?from\s+['"].*?['"]/g, "") // Remove imports
            .replace(/<[^>]+>/g, "") // Remove JSX tags
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links to text
            .replace(/[#*_~>]/g, "") // Remove markdown symbols
            .replace(/\n+/g, " ") // Newlines to spaces
            .replace(/\s+/g, " ") // Multiple spaces to single
            .trim()
            .slice(0, 2000) // Limit content size

          // Generate path for the route
          const routePath =
            entry.name === "index.mdx" || entry.name === "index.md"
              ? "/" + path.dirname(relativePath).replace(/\\/g, "/")
              : "/" + relativePath.replace(ext, "").replace(/\\/g, "/")

          // Skip root index (use "/" as path)
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
    } catch (error) {
      console.warn(
        "[ardo] Failed to scan for search index:",
        error instanceof Error ? error.message : error
      )
    }
  }

  await scanForSearch(routesDir)
  return docs
}

export default ardoPlugin
