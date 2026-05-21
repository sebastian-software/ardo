/**
 * Remark plugin that removes the first top-level `# Heading` from the document
 * when its text matches the `title` field in the YAML frontmatter.
 *
 * Ardo renders `frontmatter.title` as the page H1 above the content body
 * (see `ContentHeader` in `Content.tsx`). When an MDX file also begins with
 * `# Title`, the page shows two H1s. This plugin removes the redundant body
 * heading, but only when titles match — so a deliberately different in-content
 * H1 is preserved.
 */
import type { Heading, Root, Yaml } from "mdast"

export function remarkStripFrontmatterH1() {
  return function (tree: Root) {
    const yamlNode = tree.children.find((node): node is Yaml => node.type === "yaml")
    if (yamlNode == null) return

    const title = extractYamlTitle(yamlNode.value)
    if (title === "") return

    const firstH1Index = tree.children.findIndex(
      (node) => node.type === "heading" && node.depth === 1
    )
    if (firstH1Index === -1) return

    const h1Node = tree.children[firstH1Index] as Heading
    if (getHeadingText(h1Node).trim() === title) {
      tree.children.splice(firstH1Index, 1)
    }
  }
}

function extractYamlTitle(yaml: string): string {
  const match = /^title:\s*(.+?)\s*$/m.exec(yaml)
  if (match == null) return ""
  return match[1].replace(/^["']|["']$/g, "").trim()
}

function getHeadingText(node: Heading): string {
  const parts: string[] = []

  function extract(child: unknown) {
    if (!isRecord(child)) return
    if (child.type === "text" || child.type === "inlineCode") {
      parts.push(typeof child.value === "string" ? child.value : "")
    } else if (Array.isArray(child.children)) {
      for (const nested of child.children) extract(nested)
    }
  }

  for (const child of node.children) extract(child)
  return parts.join("")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}
