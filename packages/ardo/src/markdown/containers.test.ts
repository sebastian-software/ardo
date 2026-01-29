import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkDirective from "remark-directive"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkContainers } from "./containers"

async function processMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkContainers)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return String(result)
}

describe("remarkContainers", () => {
  it("transforms tip container", async () => {
    const markdown = `:::tip
This is a tip
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("ardo-container-tip")
    expect(result).toContain("TIP")
    expect(result).toContain("This is a tip")
  })

  it("transforms warning container", async () => {
    const markdown = `:::warning
Be careful!
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("ardo-container-warning")
    expect(result).toContain("WARNING")
    expect(result).toContain("Be careful!")
  })

  it("transforms danger container", async () => {
    const markdown = `:::danger
This is dangerous!
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("ardo-container-danger")
    expect(result).toContain("DANGER")
    expect(result).toContain("This is dangerous!")
  })

  it("transforms info container", async () => {
    const markdown = `:::info
Some information
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("ardo-container-info")
    expect(result).toContain("INFO")
    expect(result).toContain("Some information")
  })

  it("transforms note container", async () => {
    const markdown = `:::note
A note
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("ardo-container-note")
    expect(result).toContain("NOTE")
    expect(result).toContain("A note")
  })

  it("supports custom titles", async () => {
    const markdown = `:::tip Custom Title
Content here
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("Custom Title")
    expect(result).toContain("Content here")
  })

  it("handles container with multiple paragraphs", async () => {
    const markdown = `:::warning
First paragraph.

Second paragraph.
:::`

    const result = await processMarkdown(markdown)

    expect(result).toContain("First paragraph.")
    expect(result).toContain("Second paragraph.")
  })
})
