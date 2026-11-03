/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ReactNode, type SVGAttributes } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("./FileTree.css", () => ({
  comment: "comment",
  fileTree: "fileTree",
  folderIcon: "folderIcon",
  group: "group",
  highlighted: "highlighted",
  icon: "icon",
  item: "item",
  list: "list",
  name: "name",
  row: "row",
}))

import { ArdoFileTree } from "./FileTree"
import { registerIcons } from "./Icon"

function testIcon(label: string) {
  return function TestIcon(props: { size?: number } & SVGAttributes<SVGSVGElement>) {
    return <svg data-icon={label} {...props} width={props.size} height={props.size} />
  }
}

registerIcons({
  Folder: testIcon("folder"),
  FileCode: testIcon("file-code"),
  FileText: testIcon("file-text"),
})

/** Builds the list structure MDX passes to a component for a nested Markdown list. */
function tree(...items: ReactNode[]) {
  return createElement("ul", null, ...items)
}

function item(...children: ReactNode[]) {
  return createElement("li", null, ...children)
}

describe("ArdoFileTree", () => {
  it("renders a labelled list with folder and file icons", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(
          item("app/", tree(item("routes/", tree(item("index.mdx"))), item("root.tsx"))),
          item("package.json")
        )}
      </ArdoFileTree>
    )

    expect(view).toContain('aria-label="File tree"')
    expect(view.match(/data-icon="folder"/gu)).toHaveLength(2)
    expect(view.match(/data-icon="file-code"/gu)).toHaveLength(2)
    expect(view.match(/data-icon="file-text"/gu)).toHaveLength(1)
    expect(view).toContain('aria-label="Folder"')
    expect(view).toContain('aria-label="File"')
    expect(view).toContain(">app/</span>")
    expect(view).toContain(">index.mdx</span>")
    expect(view.match(/class="list group"/gu)).toHaveLength(2)
  })

  it("treats an item with a nested list as a folder even without a trailing slash", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>{tree(item("src", tree(item("index.ts"))))}</ArdoFileTree>
    )

    expect(view.match(/data-icon="folder"/gu)).toHaveLength(1)
    expect(view).toContain(">src</span>")
  })

  it("treats a trailing slash as a folder without children", () => {
    const view = renderToStaticMarkup(<ArdoFileTree>{tree(item("assets/"))}</ArdoFileTree>)

    expect(view).toContain('data-icon="folder"')
    expect(view).not.toContain("group")
  })

  it("chooses the file icon from the extension", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(item("tsconfig.json"), item("README.md"), item("styles.css"), item("logo.svg"))}
      </ArdoFileTree>
    )

    expect(view.match(/data-icon="file-code"/gu)).toHaveLength(2)
    expect(view.match(/data-icon="file-text"/gu)).toHaveLength(2)
  })

  it("highlights entries whose name is bold", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(item(createElement("strong", null, "root.tsx")), item("index.mdx"))}
      </ArdoFileTree>
    )

    expect(view.match(/class="row highlighted"/gu)).toHaveLength(1)
    expect(view).toContain(">root.tsx</span>")
    expect(view).not.toContain("<strong")
  })

  it("does not highlight an entry whose bold text is only the comment", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(item("index.mdx", " — the ", createElement("strong", null, "entry"), " route"))}
      </ArdoFileTree>
    )

    expect(view).not.toContain("highlighted")
    expect(view).toContain(">index.mdx</span>")
  })

  it("renders text after an em dash as a muted comment", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(item(createElement("strong", null, "root.tsx"), " — the root layout"))}
      </ArdoFileTree>
    )

    expect(view).toContain('<span class="name">root.tsx</span>')
    expect(view).toContain('<span class="comment">the root layout</span>')
  })

  it("keeps a hyphen inside a file name as part of the name", () => {
    const view = renderToStaticMarkup(<ArdoFileTree>{tree(item("my-page.mdx"))}</ArdoFileTree>)

    expect(view).toContain(">my-page.mdx</span>")
    expect(view).not.toContain('class="comment"')
  })

  it("reads loose list items whose labels are wrapped in paragraphs", () => {
    const view = renderToStaticMarkup(
      <ArdoFileTree>
        {tree(
          item(createElement("p", null, "app/"), tree(item(createElement("p", null, "root.tsx")))),
          item(createElement("p", null, "package.json"))
        )}
      </ArdoFileTree>
    )

    expect(view.match(/data-icon="folder"/gu)).toHaveLength(1)
    expect(view).toContain(">root.tsx</span>")
    expect(view).toContain(">package.json</span>")
  })

  it("ignores items without a name and renders nothing for an empty tree", () => {
    const sparse = renderToStaticMarkup(
      <ArdoFileTree>{tree(item(""), item("main.ts"))}</ArdoFileTree>
    )
    const empty = renderToStaticMarkup(<ArdoFileTree>{"no list here"}</ArdoFileTree>)

    expect(sparse.match(/<li/gu)).toHaveLength(1)
    expect(empty).toBe("")
  })
})
