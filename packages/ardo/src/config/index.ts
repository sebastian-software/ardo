import type {
  PressConfig,
  ResolvedConfig,
  ThemeConfig,
  MarkdownConfig,
  TypeDocConfig,
  SidebarItem,
  NavItem,
  SocialLink,
  PageFrontmatter,
  TOCItem,
  PageData,
  HeadConfig,
} from './types'
import path from 'path'

export type {
  PressConfig,
  ResolvedConfig,
  ThemeConfig,
  MarkdownConfig,
  TypeDocConfig,
  SidebarItem,
  NavItem,
  SocialLink,
  PageFrontmatter,
  TOCItem,
  PageData,
  HeadConfig,
}

export function defineConfig(config: PressConfig): PressConfig {
  return config
}

const defaultThemeConfig: ThemeConfig = {
  nav: [],
  sidebar: [],
  socialLinks: [],
  search: {
    enabled: true,
    placeholder: 'Search...',
  },
  outline: {
    level: 2,
    label: 'On this page',
  },
}

const defaultMarkdownConfig: MarkdownConfig = {
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
  lineNumbers: false,
  anchor: true,
  toc: {
    level: [2, 3],
  },
}

export function resolveConfig(config: PressConfig, root: string): ResolvedConfig {
  const srcDir = config.srcDir ?? 'content'
  const contentDir = path.resolve(root, srcDir)

  return {
    title: config.title,
    description: config.description ?? '',
    base: config.base ?? '/',
    srcDir,
    outDir: config.outDir ?? 'dist',
    lang: config.lang ?? 'en',
    head: config.head ?? [],
    themeConfig: {
      ...defaultThemeConfig,
      ...config.themeConfig,
    },
    markdown: {
      ...defaultMarkdownConfig,
      ...config.markdown,
    },
    vite: config.vite,
    root,
    contentDir,
  }
}

export async function loadConfig(root: string): Promise<ResolvedConfig> {
  const configPath = path.resolve(root, 'press.config.ts')

  try {
    const configModule = await import(configPath)
    const config = configModule.default as PressConfig
    return resolveConfig(config, root)
  } catch {
    return resolveConfig(
      {
        title: 'TanStack Press',
        description: 'Documentation powered by TanStack Press',
      },
      root
    )
  }
}
