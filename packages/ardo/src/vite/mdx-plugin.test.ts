import { decode } from "@jridgewell/sourcemap-codec"
import fs from "node:fs/promises"
import path from "node:path"
import { type ComponentType, createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer, type TransformResult, type ViteDevServer } from "vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useMDXComponents } from "../mdx/provider"
import { createMdxPlugin } from "./mdx-plugin"

const packageRoot = path.resolve(import.meta.dirname, "../..")
let tempDirectory: string
let server: undefined | ViteDevServer

beforeEach(async () => {
  tempDirectory = await fs.mkdtemp(path.join(packageRoot, ".mdx-compiler-test-"))
  await writeHarnessModules()
  server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    plugins: [createMdxPlugin(undefined)],
    resolve: {
      alias: [
        { find: "ardo/mdx-provider", replacement: path.join(tempDirectory, "provider.mjs") },
        { find: "ardo/runtime", replacement: path.join(tempDirectory, "runtime.mjs") },
        { find: "ardo/ui", replacement: path.join(tempDirectory, "ui.mjs") },
      ],
    },
    root: packageRoot,
    server: { middlewareMode: true },
  })
})

afterEach(async () => {
  await server?.close()
  await fs.rm(tempDirectory, { force: true, recursive: true })
})

describe("createMdxPlugin", () => {
  it.each([
    [
      "named function declaration",
      'export default function Layout({ children }) { return <main data-layout="named">{children}</main> }\n\ncontent',
      'data-layout="named"',
    ],
    [
      "anonymous function declaration",
      'export default function ({ children }) { return <main data-layout="anonymous">{children}</main> }\n\ncontent',
      'data-layout="anonymous"',
    ],
    [
      "expression default export",
      'export default ({ children }) => <article data-layout="expression">{children}</article>;\n\ncontent',
      'data-layout="expression"',
    ],
    [
      "imported default layout",
      'import Layout from "./layout.mjs";\nexport default Layout;\n\ncontent',
      'data-layout="imported"',
    ],
    [
      "re-exported default layout",
      'export { default } from "./layout.mjs";\n\ncontent',
      'data-layout="imported"',
    ],
  ])("renders an authored %s around the generated content", async (_name, source, marker) => {
    await fs.writeFile(path.join(tempDirectory, "layout.mjs"), layoutModule)
    const { default: route } = await loadRoute(source)
    const view = renderToStaticMarkup(createElement(route))

    expect(view).toContain(marker)
    expect(view).toContain("content")
  })

  it("compiles Mermaid JSX and uses CodeBlock and wrapper overrides from provider props", async () => {
    const { default: route } = await loadRoute(
      '```mermaid\ngraph TD\n  A --> B\n```\n\n```ts title="source.ts"\nconst answer = 42\n```'
    )
    const view = renderToStaticMarkup(
      createElement(route, {
        components: {
          CodeBlock: ({ code }: { code: string }) => createElement("mark", null, code),
          wrapper: ({ children }: { children: ReactNode }) =>
            createElement("article", { "data-provider-wrapper": true }, children),
        },
      })
    )

    expect(view).toContain('<article data-provider-wrapper="true">')
    expect(view).toContain('<pre data-mermaid="true">graph TD\n  A --&gt; B\n</pre>')
    expect(view).toContain("<mark>const answer = 42\n</mark>")
  })

  it("renders Markdown fences with Ferriki JSX and preserves fence metadata", async () => {
    const { default: route } = await loadRoute(
      '```ts title="source.ts" [API] showLineNumbers {1}\nconst answer = 42\n```'
    )
    const view = renderToStaticMarkup(createElement(route))

    expect(view).toContain('<aside data-title="source.ts" data-language="ts" data-label="API"')
    expect(view).toContain('data-line-numbers="true"')
    expect(view).toContain('data-ln="1"')
    expect(view).toMatch(/class="[^"]*highlighted/u)
    expect(view).toContain("const")
    expect(view).toContain("answer")
    expect(view).toContain("--shiki-light:")
    expect(view).toContain("--shiki-dark:")
  })

  it("uses one default code-block wrapper and copy button for a native fence", async () => {
    const { default: route } = await loadRoute(
      '```ts title="source.ts" [API] showLineNumbers {1}\nconst answer = 42\n```'
    )
    const view = renderToStaticMarkup(
      createElement(route, {
        components: {
          ...useMDXComponents(),
          wrapper: ({ children }: { children: ReactNode }) =>
            createElement("article", null, children),
        },
      })
    )

    expect(view.match(/<button\b/gu)).toHaveLength(1)
    expect(view.match(/<pre\b/gu)).toHaveLength(1)
    expect(view).toContain('data-lang="ts" data-label="API"')
    expect(view).toContain(">source.ts</div>")
    expect(view).toContain('data-ln="1"')
    expect(view).toContain("--shiki-light:")
    expect(view).toContain("--shiki-dark:")
  })

  it("keeps imported components in module scope and resolves Unicode/provider components", async () => {
    await fs.writeFile(
      path.join(tempDirectory, "components.mjs"),
      `import { jsx } from "react/jsx-runtime";\nexport function Button() { return jsx("span", { children: "import-owned" }); }\n`
    )
    const { default: route } = await loadRoute(
      'import { Button } from "./components.mjs";\n\n<Button />\n\n<ProviderButton />\n\n<α />',
      "components.mdx"
    )
    const view = renderToStaticMarkup(
      createElement(route, {
        components: {
          Button: () => createElement("span", null, "provider-button"),
          ProviderButton: () => createElement("span", null, "provider-owned"),
          α: () => createElement("span", null, "unicode-owned"),
        },
      })
    )

    expect(view).toContain("import-owned")
    expect(view).not.toContain("provider-button")
    expect(view).toContain("provider-owned")
    expect(view).toContain("unicode-owned")
  })

  it("resolves underscore-prefixed authored components and route props", async () => {
    const { default: route } = await loadRoute("<_ardoComponents />\n\n<props.Foo />")
    const view = renderToStaticMarkup(
      createElement(route, {
        Foo: () => createElement("span", null, "route-prop"),
        components: {
          _ardoComponents: () => createElement("span", null, "authored-root"),
        },
      })
    )

    expect(view).toContain("authored-root")
    expect(view).toContain("route-prop")
  })

  it.each([
    ["a Ferromark binding", "export const MDXContent = 1\n\ncontent"],
    ["an Ardo route binding", "export const _ardoRoute = 1\n\ncontent"],
  ])("rejects an authored declaration of %s", async (_name, source) => {
    await expect(loadRoute(source)).rejects.toThrow(/is reserved in MDX module output/u)
  })

  it("replaces the provider wrapper with an authored layout", async () => {
    const { default: route } = await loadRoute(
      'export default ({ children }) => <article data-layout="authored">{children}</article>;\n\ncontent'
    )
    const view = renderToStaticMarkup(createElement(route))

    expect(view).toContain('<article data-layout="authored">')
    expect(view).not.toContain("<section>")
  })

  it("names an undefined component when it renders", async () => {
    const { default: route } = await loadRoute("<Missing />")

    expect(() => renderToStaticMarkup(createElement(route))).toThrow(/`Missing`/u)
  })

  it("leaves raw Markdown imports to Vite's asset handling", async () => {
    const source = "# Raw source\n\n<Example />\n"
    const routePath = path.join(tempDirectory, "raw.mdx")
    await fs.writeFile(routePath, source)
    const rawModule = await getRunningServer().ssrLoadModule(`${routePath}?raw`)

    expect(getModuleDefault(rawModule)).toBe(source)
  })

  it("exports native frontmatter and the exact heading IDs used for rendered headings", async () => {
    const module = await loadRoute(
      "---\ntitle: Guide\n---\n# Guide\n\n## Introduction\n\nText",
      "metadata.mdx"
    )
    const view = renderToStaticMarkup(createElement(module.default))

    expect(module.frontmatter).toStrictEqual({ title: "Guide" })
    expect(module.toc).toStrictEqual([{ id: "introduction", level: 2, text: "Introduction" }])
    expect(view).not.toContain(">Guide</h1>")
    expect(view).toContain('id="introduction"')
  })

  it("keeps an authored frontmatter binding in the page data context", async () => {
    const module = await loadRoute('export const frontmatter = { title: "Authored" }\n\nText')
    const view = renderToStaticMarkup(createElement(module.default))

    expect(module.frontmatter).toStrictEqual({ title: "Authored" })
    expect(view).toContain('data-frontmatter-title="Authored"')
  })

  it("re-exports imported frontmatter and keeps the generated outline in page data", async () => {
    await fs.writeFile(
      path.join(tempDirectory, "data.mjs"),
      'export const frontmatter = { title: "Local" };\nexport const toc = [];\n'
    )
    const module = await loadRoute(
      'import { frontmatter, toc } from "./data.mjs";\n\n## Section\n\nText'
    )
    const view = renderToStaticMarkup(createElement(module.default))

    expect(module.frontmatter).toStrictEqual({ title: "Local" })
    expect(module.toc).toStrictEqual([])
    expect(view).toContain('data-frontmatter-title="Local"')
    expect(view).toContain('data-toc="section"')
  })

  it("exports a route handle for a frontmatter layout", async () => {
    const module = await loadRoute("---\nlayout: bare\n---\nText")

    expect(module.handle).toStrictEqual({ layout: "bare" })
  })

  it("maps authored ESM through Oxc using UTF-16 columns after Unicode text", async () => {
    const sourceLine = '  const note = "😀"; throw new Error("broken 🧪");'
    const source = `# Intro "😀"\nexport function fail() {\n${sourceLine}\n}\n\n# Body`
    const result = await transformMarkdownFile(source, "source-map.mdx")
    const generatedLines = result.code.split("\n")
    const generatedLine = generatedLines.findIndex((line) => line.includes("throw new Error"))
    const generatedColumn = generatedLines[generatedLine]?.indexOf("throw new Error") ?? -1
    const mappings = decode(result.map?.mappings ?? "")
    const segment = [...(mappings[generatedLine] ?? [])]
      .reverse()
      .find((candidate) => candidate[0] <= generatedColumn && candidate.length >= 4)

    expect(segment?.[2]).toBe(2)
    expect(segment?.[3]).toBe(sourceLine.indexOf("throw"))
  })
})

async function loadRoute(source: string, filename = "route.mdx") {
  const routePath = path.join(tempDirectory, filename)
  await fs.writeFile(routePath, source)
  const loadedModule = await getRunningServer().ssrLoadModule(routePath)
  if (!isRouteModule(loadedModule))
    throw new Error("The Markdown route module has an invalid shape.")
  return loadedModule
}

async function transformMarkdownFile(source: string, filename: string): Promise<TransformResult> {
  const sourcePath = path.join(tempDirectory, filename)
  await fs.writeFile(sourcePath, source)
  const result = await getRunningServer().transformRequest(sourcePath, { ssr: true })
  if (result == null) throw new Error("Vite did not transform the Markdown source file.")
  return result
}

function getRunningServer(): ViteDevServer {
  if (server == null) throw new Error("The Vite test server was not started.")
  return server
}

type RouteModule = {
  default: ComponentType<Record<string, unknown>>
  frontmatter?: Record<string, unknown>
  handle?: unknown
  toc?: unknown[]
}

function isRouteModule(module: unknown): module is RouteModule {
  return (
    isRecord(module) &&
    typeof module.default === "function" &&
    (module.frontmatter === undefined || isRecord(module.frontmatter)) &&
    (module.toc === undefined || Array.isArray(module.toc))
  )
}

function getModuleDefault(module: unknown): unknown {
  if (!isRecord(module)) throw new Error("Vite returned an invalid module namespace.")
  return module.default
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

async function writeHarnessModules(): Promise<void> {
  await Promise.all([
    fs.writeFile(
      path.join(tempDirectory, "provider.mjs"),
      `import { jsx } from "react/jsx-runtime";\n` +
        `const wrapper = ({ children }) => jsx("section", { children });\n` +
        `const CodeBlock = (props) => jsx("aside", { "data-title": props.title, ` +
        `"data-language": props.language, "data-label": props["data-label"], ` +
        `"data-line-numbers": props.lineNumbers, children: props.children ?? props.code });\n` +
        `export function useMDXComponents() { return { wrapper, CodeBlock }; }\n`
    ),
    fs.writeFile(
      path.join(tempDirectory, "runtime.mjs"),
      `import { jsx } from "react/jsx-runtime";\n` +
        `export function ArdoPageDataProvider({ children, frontmatter, toc }) { ` +
        `return jsx("div", { "data-frontmatter-title": frontmatter.title ?? "", ` +
        `"data-toc": toc.map((item) => item.id).join(","), children }); }\n`
    ),
    fs.writeFile(
      path.join(tempDirectory, "ui.mjs"),
      `import { jsx } from "react/jsx-runtime";\n` +
        `export function ArdoMermaid({ code, children }) { return jsx("pre", { "data-mermaid": true, children: code ?? children }); }\n`
    ),
  ])
}

const layoutModule =
  `import { jsx } from "react/jsx-runtime";\n` +
  `export default function Layout({ children }) { ` +
  `return jsx("main", { "data-layout": "imported", children }); }\n`
