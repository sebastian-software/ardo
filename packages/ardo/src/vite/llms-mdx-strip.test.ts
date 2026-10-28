import { prepareDocument } from "ferromark"
import fs from "node:fs/promises"
import { describe, expect, it } from "vitest"

import { stripMdxSyntaxOutsideCodeFences } from "./llms-mdx-strip"

describe("LLM Markdown projection", () => {
  it("uses the site's enabled heading syntax during MDX projection", () => {
    const output = stripMdxSyntaxOutsideCodeFences("## Überschrift {#stable}\n\nText.", undefined, {
      markdown: { headingAttributes: true },
    })
    expect(output).toContain("Überschrift")
    expect(output).toContain("Text.")
  })

  it("removes authored ESM and MDX wrappers while keeping static text and hyperlinks", () => {
    const input =
      'import { Demo } from "./demo"\n\nexport const value = 1\n\n# Guide\n\n<Demo>\nKeep [this guide](/guide/start).\n</Demo>\n\n`<Demo />`\n'
    const result = stripMdxSyntaxOutsideCodeFences(input, "Guide")
    expect(result).toContain("Keep [this guide](/guide/start).")
    expect(result).toContain("`<Demo />`")
    expect(result).not.toContain("import { Demo }")
    expect(result).not.toContain("export const")
    expect(result).not.toContain("# Guide")
    expect(result).not.toContain("\n<Demo>")
  })

  it.each([
    { marker: "`", other: "~" },
    { marker: "~", other: "`" },
  ])(
    "preserves $marker fences and ignores shorter, other-marker, or non-closing runs",
    ({ marker, other }) => {
      const code = [
        `${marker.repeat(4)}mdx`,
        'import { ArdoLink } from "ardo/ui"',
        `${marker.repeat(3)}tsx`,
        '<ArdoLink to="/guide/start">[Example](/guide/start)</ArdoLink>  ',
        "",
        "",
        marker.repeat(3),
        other.repeat(4),
        `${marker.repeat(4)}not-a-closing-fence`,
        "export const example = true",
        marker.repeat(5),
      ].join("\n")
      const result = stripMdxSyntaxOutsideCodeFences(`${code}\n\n<Demo>After the fence.</Demo>`)
      expect(result).toContain(code)
      expect(result).toContain("After the fence.")
      expect(result).not.toContain("<Demo>After")
    }
  )

  it("preserves indented code and inline code containing import or JSX syntax", () => {
    const code =
      '    import { Demo } from "./demo"\n    <Demo />  \n\n`import { Demo }` and ``<Demo text="`" />``'
    expect(stripMdxSyntaxOutsideCodeFences(code)).toBe(code)
  })

  it.each(["markdown", "troubleshooting"])(
    "preserves every highlighted code example in the actual %s guide",
    async (name) => {
      const source = await fs.readFile(
        new URL(`../../../../docs/app/content/guide/${name}.mdx`, import.meta.url),
        "utf8"
      )
      const original = prepareDocument(source, { format: "mdx" })
      const projected = prepareDocument(stripMdxSyntaxOutsideCodeFences(source), { format: "mdx" })
      expect(projected.metadata.codeBlocks.filter((block) => block.language != null)).toStrictEqual(
        original.metadata.codeBlocks.filter((block) => block.language != null)
      )
    }
  )
})
