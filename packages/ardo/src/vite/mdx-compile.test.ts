import { JsxCompiler } from "ferromark"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { MarkdownConfig } from "../config/types"

import { readNativeMarkdownMetadata } from "../markdown/native-metadata"
import { compileMdxRouteModule } from "./mdx-compile"

afterEach(() => vi.restoreAllMocks())

describe("prepared route compilation", () => {
  it("prepares once and derives the TOC from the final module heading plan", () => {
    const prepare = vi.spyOn(JsxCompiler.prototype, "prepare")
    const compile = vi.spyOn(JsxCompiler.prototype, "compile")
    const source = "---\ntitle: Café\n---\n\n# Café\n\n## Café\n\n## Café\n\nText[^1]\n\n[^1]: Note"
    const markdownConfig: MarkdownConfig = {
      headingOffset: 1,
      headingIdPrefix: "page-",
      toc: { level: [3, 3] },
    }
    const result = compileMdxRouteModule({ source, markdownConfig, format: "mdx", id: "page.mdx" })
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(compile).not.toHaveBeenCalled()
    expect(prepare.mock.calls[0][1]).not.toHaveProperty("headingOffset")
    expect(prepare.mock.calls[0][1]).not.toHaveProperty("headingIdPrefix")
    const metadata = readNativeMarkdownMetadata(source, "mdx", markdownConfig)
    expect(metadata.headings.map(({ id, level }) => ({ id, level }))).toStrictEqual([
      { id: "page-café", level: 3 },
      { id: "page-café-1", level: 3 },
    ])
    for (const heading of metadata.headings) {
      expect(result.code).toContain(JSON.stringify(heading.id))
    }
    expect(result.code).toContain('"id":"page-café-1"')
    expect(metadata.content).not.toMatch(/^# Café$/m)
  })

  it("reads changed YAML and heading IDs on every transform of the same file", () => {
    const compile = (title: string) =>
      compileMdxRouteModule({
        source: `---\ntitle: ${title}\n---\n\n# ${title}\n\n## ${title}`,
        markdownConfig: undefined,
        format: "md",
        id: "same.md",
      }).code
    expect(compile("Before")).toContain('"id":"before"')
    const changed = compile("After")
    expect(changed).toContain('"title":"After"')
    expect(changed).toContain('"id":"after"')
    expect(changed).not.toContain('"before"')
  })
})
