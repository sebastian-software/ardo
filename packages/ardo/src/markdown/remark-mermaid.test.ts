import type { Root } from "mdast"

import remarkParse from "remark-parse"
import { unified } from "unified"
import { describe, expect, it } from "vitest"

import { remarkMermaid } from "./remark-mermaid"

function transform(markdown: string): Root {
  const processor = unified().use(remarkParse).use(remarkMermaid)
  const tree = processor.parse(markdown)
  processor.runSync(tree)
  return tree
}

function collectNodes(tree: Root, type: string): Array<Record<string, unknown>> {
  const matches: Array<Record<string, unknown>> = []
  const queue: unknown[] = [...tree.children]
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const node = queue.shift() as Record<string, unknown>
    if (node.type === type) {
      matches.push(node)
    }
    if (Array.isArray(node.children)) {
      queue.push(...(node.children as unknown[]))
    }
  }
  return matches
}

describe("remarkMermaid", () => {
  it("replaces mermaid fences with the ArdoMermaid JSX element", () => {
    const tree = transform("# Title\n\n```mermaid\ngraph TD\n  A --> B\n```\n")

    const elements = collectNodes(tree, "mdxJsxFlowElement")
    expect(elements).toHaveLength(1)
    expect(elements[0].name).toBe("__ArdoMermaid")

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const attributes = elements[0].attributes as Array<{ name: string; value: string }>
    expect(attributes[0].name).toBe("code")
    expect(attributes[0].value).toBe("graph TD\n  A --> B")
  })

  it("injects a single ardo/ui import when diagrams are present", () => {
    const tree = transform("```mermaid\ngraph A\n```\n\n```mermaid\ngraph B\n```\n")

    const imports = collectNodes(tree, "mdxjsEsm")
    expect(imports).toHaveLength(1)
    expect(imports[0].value).toContain('from "ardo/ui"')
    expect(collectNodes(tree, "mdxJsxFlowElement")).toHaveLength(2)
  })

  it("leaves other code fences and documents without diagrams untouched", () => {
    const tree = transform("```ts\nconst a = 1\n```\n")

    expect(collectNodes(tree, "mdxJsxFlowElement")).toHaveLength(0)
    expect(collectNodes(tree, "mdxjsEsm")).toHaveLength(0)
    expect(collectNodes(tree, "code")).toHaveLength(1)
  })
})
