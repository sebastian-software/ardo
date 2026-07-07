import { describe, expect, test } from "vitest"

import { createMdxOptions } from "./mdx-plugin"

const remarkUserPlugin = () => (tree: unknown) => tree
const rehypeUserPlugin = () => (tree: unknown) => tree

describe("createMdxOptions", () => {
  test("appends configured user remark and rehype plugins after built-ins", () => {
    const options = createMdxOptions({
      remarkPlugins: [remarkUserPlugin],
      rehypePlugins: [rehypeUserPlugin],
    })

    expect(options?.remarkPlugins?.at(-1)).toBe(remarkUserPlugin)
    expect(options?.rehypePlugins?.at(-1)).toBe(rehypeUserPlugin)
  })
})
