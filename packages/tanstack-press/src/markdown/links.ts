import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export interface RehypeLinkOptions {
  basePath: string
}

/**
 * Rehype plugin that rewrites internal links to include the basePath.
 * This is needed for static sites deployed to subpaths (e.g., GitHub Pages).
 */
export function rehypeLinks(options: RehypeLinkOptions) {
  const { basePath } = options

  // Normalize basePath: ensure it starts with / and doesn't end with /
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')

  return (tree: Root) => {
    if (!normalizedBase) {
      // No basePath to add
      return
    }

    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'a') {
        const href = node.properties?.href

        if (typeof href === 'string') {
          // Only rewrite internal links that start with /
          // Don't rewrite: external URLs, anchors, relative paths, or already prefixed paths
          if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith(normalizedBase)) {
            node.properties = node.properties || {}
            node.properties.href = normalizedBase + href
          }
        }
      }
    })
  }
}
