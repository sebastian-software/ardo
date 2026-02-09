import type { Root } from "mdast"
import type { ContainerDirective } from "mdast-util-directive"
import { visit } from "unist-util-visit"

const containerTypes = [
  "tip",
  "warning",
  "danger",
  "info",
  "note",
  "details",
  "code-group",
] as const
type ContainerType = (typeof containerTypes)[number]

const defaultTitles: Record<ContainerType, string> = {
  tip: "TIP",
  warning: "WARNING",
  danger: "DANGER",
  info: "INFO",
  note: "NOTE",
  details: "Details",
  "code-group": "",
}

export function remarkContainers() {
  return function (tree: Root) {
    visit(tree, "containerDirective", (node: ContainerDirective) => {
      const type = node.name as ContainerType

      if (!containerTypes.includes(type)) {
        return
      }

      const data = node.data || (node.data = {})

      const titleNode = node.children[0]
      let customTitle: string | undefined

      if (
        titleNode &&
        titleNode.type === "paragraph" &&
        titleNode.children[0]?.type === "text" &&
        titleNode.data?.directiveLabel
      ) {
        customTitle = (titleNode.children[0] as { value: string }).value
        node.children.shift()
      }

      const title = customTitle || defaultTitles[type]

      if (type === "code-group") {
        data.hName = "div"
        data.hProperties = {
          className: ["ardo-code-group"],
        }

        const tabs: Array<{ label: string; content: unknown }> = []

        for (const child of node.children) {
          if (child.type === "code") {
            const codeNode = child as { lang?: string; meta?: string; value: string }
            const meta = codeNode.meta || ""
            const labelMatch = meta.match(/\[([^\]]+)\]/)
            const label = labelMatch ? labelMatch[1] : codeNode.lang || "Code"
            tabs.push({ label, content: child })
          }
        }

        const tabsHtml = tabs
          .map(
            (tab, i) =>
              `<button class="ardo-code-group-tab${i === 0 ? " active" : ""}" data-index="${i}">${escapeHtml(tab.label)}</button>`
          )
          .join("")

        node.children = [
          {
            type: "html",
            value: `<div class="ardo-code-group-tabs">${tabsHtml}</div>`,
          } as unknown as (typeof node.children)[number],
          {
            type: "html",
            value: '<div class="ardo-code-group-panels">',
          } as unknown as (typeof node.children)[number],
          ...tabs.map(
            (tab, i) =>
              ({
                type: "html",
                value: `<div class="ardo-code-group-panel${i === 0 ? " active" : ""}" data-index="${i}">`,
              }) as unknown as (typeof node.children)[number]
          ),
          ...node.children.flatMap((child: (typeof node.children)[number], _i: number) => [
            child,
            {
              type: "html",
              value: "</div>",
            } as unknown as (typeof node.children)[number],
          ]),
          {
            type: "html",
            value: "</div>",
          } as unknown as (typeof node.children)[number],
        ]

        return
      }

      if (type === "details") {
        data.hName = "details"
        data.hProperties = {
          className: ["ardo-details"],
        }

        node.children.unshift({
          type: "html",
          value: `<summary class="ardo-details-summary">${escapeHtml(title)}</summary>`,
        } as unknown as (typeof node.children)[number])

        return
      }

      data.hName = "div"
      data.hProperties = {
        className: ["ardo-container", `ardo-container-${type}`],
      }

      node.children.unshift({
        type: "html",
        value: `<p class="ardo-container-title">${escapeHtml(title)}</p>`,
      } as unknown as (typeof node.children)[number])
    })
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * MDX-compatible remark plugin that converts container directives
 * (:::tip, :::warning, etc.) to MDX JSX elements (<Tip>, <Warning>, etc.)
 * that map to the React components in ardo/ui.
 *
 * Unlike remarkContainers (which uses raw HTML nodes for the title),
 * this produces proper MDX JSX flow elements that work with @mdx-js/rollup.
 */
const containerToComponent: Record<string, string> = {
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
  info: "Info",
  note: "Note",
}

export function remarkContainersMdx() {
  return function (tree: Root) {
    visit(tree, "containerDirective", (node: ContainerDirective, index, parent) => {
      const componentName = containerToComponent[node.name]
      if (!componentName) return

      // Extract custom title from directive label
      const titleNode = node.children[0]
      let customTitle: string | undefined

      if (
        titleNode &&
        titleNode.type === "paragraph" &&
        titleNode.children[0]?.type === "text" &&
        titleNode.data?.directiveLabel
      ) {
        customTitle = (titleNode.children[0] as { value: string }).value
        node.children.shift()
      }

      // Build MDX JSX attributes
      const attributes: Array<{
        type: "mdxJsxAttribute"
        name: string
        value: string
      }> = []

      if (customTitle) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: customTitle,
        })
      }

      // Replace the directive node with an MDX JSX flow element
      const jsxNode = {
        type: "mdxJsxFlowElement" as const,
        name: componentName,
        attributes,
        children: node.children,
      }

      if (parent && typeof index === "number") {
        parent.children[index] = jsxNode as unknown as (typeof parent.children)[number]
      }
    })
  }
}
