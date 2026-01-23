import { createHighlighter, type Highlighter, type BundledTheme } from 'shiki'
import type { Root, Element, Text } from 'hast'
import { visit } from 'unist-util-visit'
import type { MarkdownConfig } from '../config/types'

export type ShikiHighlighter = Highlighter

export async function createShikiHighlighter(config: MarkdownConfig): Promise<ShikiHighlighter> {
  const themeConfig = config.theme ?? {
    light: 'github-light',
    dark: 'github-dark',
  }

  const themes: BundledTheme[] =
    typeof themeConfig === 'string' ? [themeConfig] : [themeConfig.light, themeConfig.dark]

  const highlighter = await createHighlighter({
    themes,
    langs: [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'json',
      'html',
      'css',
      'markdown',
      'bash',
      'shell',
      'yaml',
      'python',
      'rust',
      'go',
      'sql',
      'diff',
    ],
  })

  return highlighter
}

interface RehypeShikiOptions {
  highlighter: ShikiHighlighter
  config: MarkdownConfig
}

export function rehypeShikiFromHighlighter(options: RehypeShikiOptions) {
  const { highlighter, config } = options

  const themeConfig = config.theme ?? {
    light: 'github-light',
    dark: 'github-dark',
  }

  return function (tree: Root) {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'pre' ||
        !node.children[0] ||
        (node.children[0] as Element).tagName !== 'code'
      ) {
        return
      }

      const codeNode = node.children[0] as Element
      const className = (codeNode.properties?.className as string[]) || []
      const langClass = className.find((c) => c.startsWith('language-'))
      const lang = langClass ? langClass.replace('language-', '') : 'text'

      const codeContent = getTextContent(codeNode)

      if (!codeContent.trim()) {
        return
      }

      try {
        let html: string

        if (typeof themeConfig === 'string') {
          html = highlighter.codeToHtml(codeContent, {
            lang,
            theme: themeConfig,
          })
        } else {
          html = highlighter.codeToHtml(codeContent, {
            lang,
            themes: {
              light: themeConfig.light,
              dark: themeConfig.dark,
            },
            defaultColor: false,
          })
        }

        const metaString = (codeNode.properties?.metastring as string) || ''
        const lineNumbers = config.lineNumbers || metaString.includes('showLineNumbers')
        const highlightLines = parseHighlightLines(metaString)
        const title = parseTitle(metaString)

        const wrapperHtml = buildCodeBlockHtml(html, {
          lang,
          lineNumbers,
          highlightLines,
          title,
        })

        if (parent && typeof index === 'number') {
          const newNode: Element = {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['press-code-block'],
              'data-lang': lang,
            },
            children: [
              {
                type: 'raw',
                value: wrapperHtml,
              } as unknown as Element,
            ],
          }
          parent.children[index] = newNode
        }
      } catch {
        // If highlighting fails, leave the node unchanged
      }
    })
  }
}

function getTextContent(node: Element | Text): string {
  if (node.type === 'text') {
    return node.value
  }
  if ('children' in node) {
    return node.children.map((child) => getTextContent(child as Element | Text)).join('')
  }
  return ''
}

function parseHighlightLines(meta: string): number[] {
  const match = meta.match(/\{([\d,-]+)\}/)
  if (!match) return []

  const ranges = match[1].split(',')
  const lines: number[] = []

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number)
      for (let i = start; i <= end; i++) {
        lines.push(i)
      }
    } else {
      lines.push(Number(range))
    }
  }

  return lines
}

function parseTitle(meta: string): string | undefined {
  const match = meta.match(/title="([^"]+)"/)
  return match ? match[1] : undefined
}

interface CodeBlockOptions {
  lang: string
  lineNumbers: boolean
  highlightLines: number[]
  title?: string
}

function buildCodeBlockHtml(shikiHtml: string, options: CodeBlockOptions): string {
  const { lang, lineNumbers, highlightLines, title } = options

  let html = ''

  if (title) {
    html += `<div class="press-code-title">${escapeHtml(title)}</div>`
  }

  html += `<div class="press-code-wrapper" data-lang="${lang}">`

  if (lineNumbers || highlightLines.length > 0) {
    const lines = shikiHtml.split('\n')
    const processedHtml = lines
      .map((line, i) => {
        const lineNum = i + 1
        const isHighlighted = highlightLines.includes(lineNum)
        const classes = ['press-code-line']
        if (isHighlighted) classes.push('highlighted')

        let prefix = ''
        if (lineNumbers) {
          prefix = `<span class="press-line-number">${lineNum}</span>`
        }

        return `<span class="${classes.join(' ')}">${prefix}${line}</span>`
      })
      .join('\n')

    html += processedHtml
  } else {
    html += shikiHtml
  }

  html += `<button class="press-copy-button" data-code="${encodeURIComponent(extractCodeFromHtml(shikiHtml))}">
    <span class="press-copy-icon">Copy</span>
    <span class="press-copied-icon" style="display:none">Copied!</span>
  </button>`

  html += '</div>'

  return html
}

function extractCodeFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
