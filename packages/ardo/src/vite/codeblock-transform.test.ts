// @vitest-environment jsdom

import { JsxCompiler } from "ferromark"
import { runInNewContext } from "node:vm"
import { createElement, isValidElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import * as jsxRuntime from "react/jsx-runtime"
import { transformWithOxc } from "vite"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoCodeBlock } from "../ui/components/CodeBlock"
import { transformArdoCodeBlocks } from "./codeblock-transform"

async function evaluateJsx(source: string) {
  const result = await transformWithOxc(`const render = () => (${source});`, "sample.tsx", {
    lang: "tsx",
    jsx: { runtime: "automatic" },
  })
  // Only evaluate the test's generated trusted program; preserve its JSX runtime.
  const element: unknown = runInNewContext(`${result.code}; render();`, {
    require: () => jsxRuntime,
    ArdoCodeBlock,
  })
  if (!isValidElement(element)) throw new Error("Expected generated JSX to produce a React element")
  return element
}

function codeElement(html: string): HTMLElement {
  const container = document.createElement("div")
  container.innerHTML = html
  const pre = container.querySelector("pre")
  if (pre == null) throw new Error("Expected native pre output")
  return pre
}

afterEach(() => vi.restoreAllMocks())

describe("native TSX code blocks", () => {
  it.each(["ts", "tsx", "html", "ardo-unknown-language"])(
    "matches Markdown fence rendering for %s, including metadata and blank/trailing lines",
    async (language) => {
      const code = 'const value = "<&>"\n\nconst end = 2\n'
      const meta = 'title="sample" [API] {3} showLineNumbers'
      const source = `<ArdoCodeBlock code={${JSON.stringify(code)}} language="${language}" meta={${JSON.stringify(meta)}} />`
      const transformed = await transformArdoCodeBlocks(source)
      expect(transformed).not.toContain("__html=")
      const view = renderToStaticMarkup(await evaluateJsx(transformed))
      const compiler = new JsxCompiler()
      const { body } = compiler.compile(`\`\`\`${language} ${meta}\n${code}\`\`\``)
      const fence = codeElement(renderToStaticMarkup(await evaluateJsx(body)))
      const tsx = codeElement(view)
      expect(tsx.outerHTML).toBe(fence.outerHTML)
      expect(tsx.textContent).toBe(code)
      expect(view).toContain('data-label="API"')
      expect(view).toContain(`data-lang="${language}"`)
      expect(view).toContain(">sample</div>")
      expect(tsx.querySelector('[data-ln="4"]')).not.toBeNull()
      expect(tsx.querySelector(".highlighted")?.getAttribute("data-ln")).toBe("3")
    }
  )

  it("keeps outdented copy text, escapes, and literal replacement patterns", async () => {
    const transformed = await transformArdoCodeBlocks(
      '<ArdoCodeBlock language="text">{`\n  $& <tag>\n  lineNumbers \\\\n\n`}</ArdoCodeBlock>'
    )
    const element = await evaluateJsx(transformed)
    const view = renderToStaticMarkup(element)
    expect(codeElement(view).textContent).toBe("$& <tag>\nlineNumbers \\n")
    expect(view).not.toContain("<tag>")
    // The runtime's copy button receives the same original text as the native output.
    expect(element).toHaveProperty("props.code", "$& <tag>\nlineNumbers \\n")
  })

  it("honors explicit line-number/highlight/title/label overrides", async () => {
    const source =
      '<ArdoCodeBlock code={"a\\n\\nb\\n"} language="text" meta={\'title="meta" [Meta] {3} showLineNumbers\'} lineNumbers={false} highlightLines={[1]} title="Explicit" data-label="Tab" />'
    const transformed = await transformArdoCodeBlocks(source, { lineNumbers: true })
    const view = renderToStaticMarkup(await evaluateJsx(transformed))
    const pre = codeElement(view)
    expect(pre.querySelector("[data-ln]")).toBeNull()
    expect(pre.querySelector(".highlighted")?.textContent).toBe("a")
    expect(view).toContain(">Explicit</div>")
    expect(view).toContain('data-label="Tab"')
    expect(view).not.toContain(">meta</div>")
  })

  it.each([
    '<ArdoCodeBlock code={sample} language="ts" />',
    // eslint-disable-next-line no-template-curly-in-string -- Authored interpolation fixture.
    '<ArdoCodeBlock language="ts">{`hello ${name}`}</ArdoCodeBlock>',
    '<ArdoCodeBlock language="ts"><Custom /></ArdoCodeBlock>',
    '<ArdoCodeBlock code="sample" language="ts" lineNumbers={setting} />',
    '<ArdoCodeBlock code="sample" language="ts" {...options} />',
    '<ArdoCodeBlock __html="<pre>custom</pre>" code="sample" language="ts" />',
  ])("preserves authored runtime inputs: %s", async (source) => {
    expect(await transformArdoCodeBlocks(source)).toBe(source)
  })

  it("leaves authored input intact and names the source when native rendering fails", async () => {
    vi.spyOn(JsxCompiler.prototype, "renderCodeBlock").mockImplementation(() => {
      throw new Error("asset failure")
    })
    const warn = vi.spyOn(console, "warn").mockReturnValue(undefined)
    const source = '<ArdoCodeBlock code="sample" language="ts" />'
    expect(
      await transformArdoCodeBlocks(source, undefined, { sourcePath: "/site/app/demo.tsx" })
    ).toBe(source)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("/site/app/demo.tsx"),
      expect.any(Error)
    )
  })

  it("keeps the public __html rendering input", () => {
    const view = renderToStaticMarkup(
      createElement(ArdoCodeBlock, { __html: "<pre><code>compat</code></pre>", code: "original" })
    )
    expect(view).toContain("<pre><code>compat</code></pre>")
    expect(view).toContain('aria-label="Copy code"')
  })
})
