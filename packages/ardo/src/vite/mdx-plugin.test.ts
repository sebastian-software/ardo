import remarkFrontmatter from "remark-frontmatter"
import { describe, expect, test } from "vitest"

import { createMdxOptions } from "./mdx-plugin"

const passthroughPlugin = (tree: unknown) => tree

function remarkUserPlugin() {
  return passthroughPlugin
}

function rehypeUserPlugin() {
  return passthroughPlugin
}

describe("createMdxOptions", () => {
  test("appends configured user remark and rehype plugins after built-ins", () => {
    const options = createMdxOptions({
      remarkPlugins: [remarkUserPlugin],
      rehypePlugins: [rehypeUserPlugin],
    })

    expect(options?.remarkPlugins?.at(-1)).toBe(remarkUserPlugin)
    expect(options?.rehypePlugins?.at(-1)).toBe(rehypeUserPlugin)
    expect(options?.remarkPlugins?.length).toBeGreaterThan(1)
    expect(options?.remarkPlugins).toContain(remarkFrontmatter)
    expect(options?.rehypePlugins?.length).toBeGreaterThan(1)
  })

  test("uses built-in plugins when no markdown config is supplied", () => {
    const options = createMdxOptions(undefined)

    expect(options?.remarkPlugins?.length).toBeGreaterThan(1)
    expect(options?.remarkPlugins).toContain(remarkFrontmatter)
    expect(options?.rehypePlugins?.length).toBeGreaterThan(0)
  })
})
