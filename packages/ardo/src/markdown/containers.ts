import type { Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { visit } from 'unist-util-visit'

const containerTypes = [
  'tip',
  'warning',
  'danger',
  'info',
  'note',
  'details',
  'code-group',
] as const
type ContainerType = (typeof containerTypes)[number]

const defaultTitles: Record<ContainerType, string> = {
  tip: 'TIP',
  warning: 'WARNING',
  danger: 'DANGER',
  info: 'INFO',
  note: 'NOTE',
  details: 'Details',
  'code-group': '',
}

export function remarkContainers() {
  return function (tree: Root) {
    visit(tree, 'containerDirective', (node: ContainerDirective) => {
      const type = node.name as ContainerType

      if (!containerTypes.includes(type)) {
        return
      }

      const data = node.data || (node.data = {})

      const titleNode = node.children[0]
      let customTitle: string | undefined

      if (
        titleNode &&
        titleNode.type === 'paragraph' &&
        titleNode.children[0]?.type === 'text' &&
        titleNode.data?.directiveLabel
      ) {
        customTitle = (titleNode.children[0] as { value: string }).value
        node.children.shift()
      }

      const title = customTitle || defaultTitles[type]

      if (type === 'code-group') {
        data.hName = 'div'
        data.hProperties = {
          className: ['press-code-group'],
        }

        const tabs: Array<{ label: string; content: unknown }> = []

        for (const child of node.children) {
          if (child.type === 'code') {
            const codeNode = child as { lang?: string; meta?: string; value: string }
            const meta = codeNode.meta || ''
            const labelMatch = meta.match(/\[([^\]]+)\]/)
            const label = labelMatch ? labelMatch[1] : codeNode.lang || 'Code'
            tabs.push({ label, content: child })
          }
        }

        const tabsHtml = tabs
          .map(
            (tab, i) =>
              `<button class="press-code-group-tab${i === 0 ? ' active' : ''}" data-index="${i}">${escapeHtml(tab.label)}</button>`
          )
          .join('')

        node.children = [
          {
            type: 'html',
            value: `<div class="press-code-group-tabs">${tabsHtml}</div>`,
          } as unknown as (typeof node.children)[number],
          {
            type: 'html',
            value: '<div class="press-code-group-panels">',
          } as unknown as (typeof node.children)[number],
          ...tabs.map(
            (tab, i) =>
              ({
                type: 'html',
                value: `<div class="press-code-group-panel${i === 0 ? ' active' : ''}" data-index="${i}">`,
              }) as unknown as (typeof node.children)[number]
          ),
          ...node.children.flatMap((child: (typeof node.children)[number], _i: number) => [
            child,
            {
              type: 'html',
              value: '</div>',
            } as unknown as (typeof node.children)[number],
          ]),
          {
            type: 'html',
            value: '</div>',
          } as unknown as (typeof node.children)[number],
        ]

        return
      }

      if (type === 'details') {
        data.hName = 'details'
        data.hProperties = {
          className: ['press-details'],
        }

        node.children.unshift({
          type: 'html',
          value: `<summary class="press-details-summary">${escapeHtml(title)}</summary>`,
        } as unknown as (typeof node.children)[number])

        return
      }

      data.hName = 'div'
      data.hProperties = {
        className: ['press-container', `press-container-${type}`],
      }

      node.children.unshift({
        type: 'html',
        value: `<p class="press-container-title">${escapeHtml(title)}</p>`,
      } as unknown as (typeof node.children)[number])
    })
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
