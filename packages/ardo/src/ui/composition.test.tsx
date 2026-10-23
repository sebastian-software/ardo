// @vitest-environment jsdom

import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { useMDXComponents } from "../mdx/provider"
import { ArdoPageDataProvider, ArdoProvider } from "../runtime/hooks"
import { ArdoPageProvider } from "../runtime/page"
import { ArdoRoot } from "./ArdoRoot"
import { ArdoHeaderSearch } from "./components/HeaderSearch"
import { ArdoDocContent } from "./DocPage"
import { ArdoMobileNavigation } from "./MobileNavigation"
import { ArdoTOC } from "./Toc"

vi.mock("./components/Search", () => ({
  ArdoSearch: () => <input aria-label="Search input" />,
}))

function Page({ children, path = "/guide" }: { children: ReactNode; path?: string }) {
  return (
    <ArdoPageProvider path={path}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoPageDataProvider
          frontmatter={{ title: "Default title" }}
          toc={[{ id: "static", level: 2, text: "Static heading" }]}
        >
          {children}
        </ArdoPageDataProvider>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function CustomHeader() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ArdoMobileNavigation open={open} onOpenChange={setOpen}>
        <a href="/next/">Next page</a>
      </ArdoMobileNavigation>
      <ArdoHeaderSearch variant="icon" onActivate={() => setOpen(false)} />
    </>
  )
}

function MappedContent() {
  const { wrapper: Wrapper, Feature, table: Table } = useMDXComponents()
  return (
    <Wrapper>
      <Feature />
      <Table>
        <tbody>
          <tr>
            <td>Default table</td>
          </tr>
        </tbody>
      </Table>
    </Wrapper>
  )
}

const domPage = (extra = false) => (
  <Page>
    <main id="main-content">
      <nav>
        <h2>Navigation heading</h2>
      </nav>
      <div className="ardo-content-body">
        <h2 id="static">Static heading</h2>
        <section>
          <h2>Component heading</h2>
          <h3 id="detail">Component detail</h3>
        </section>
        <div data-ardo-toc="exclude">
          <h2>Example output</h2>
        </div>
        {extra && <h2 id="late">Late heading</h2>}
      </div>
      <ArdoTOC source="dom" />
    </main>
  </Page>
)

describe("site-owned documentation composition", () => {
  it("adds to the default MDX set and replaces the wrapper through ArdoRoot", () => {
    const html = renderToStaticMarkup(
      <ArdoPageProvider path="/guide" component={MappedContent}>
        <ArdoRoot
          config={{ title: "Docs" }}
          header={false}
          footer={false}
          sidebar={false}
          components={{
            wrapper: ({ children }: { children: ReactNode }) => (
              <section data-custom-wrapper>{children}</section>
            ),
            Feature: () => <p>A custom component</p>,
          }}
        />
      </ArdoPageProvider>
    )
    expect(html).toContain("data-custom-wrapper")
    expect(html).toContain("A custom component")
    expect(html).toContain("Default table")
    expect(html).not.toContain("ardo-content-header")
  })

  it("replaces or omits article slots without duplicating the default title or rail", () => {
    const html = renderToStaticMarkup(
      <Page>
        <ArdoDocContent
          header={<h1>Custom hero</h1>}
          footer={<p>Custom ending</p>}
          outline={false}
          rail={<aside>Custom rail</aside>}
        >
          <p>Article body</p>
        </ArdoDocContent>
      </Page>
    )
    expect(html).toContain("Custom hero")
    expect(html).toContain("Custom ending")
    expect(html).toContain("Custom rail")
    expect(html).toContain("Article body")
    expect(html).not.toContain("Default title")
    expect(html).not.toContain("ardo-page-outline")
    expect(html).not.toContain("ardo-page-rail ")
  })

  it("restores navigation focus and transfers focus to the search overlay", async () => {
    const user = userEvent.setup()
    render(
      <Page>
        <CustomHeader />
      </Page>
    )
    const menu = screen.getByRole("button", { name: "Toggle menu" })
    await user.click(menu)
    const dialog = screen.getByRole("dialog", { name: "Docs navigation menu" })
    expect(menu.getAttribute("aria-controls")).toBe(dialog.id)
    expect(document.body.style.overflow).toBe("hidden")
    await user.keyboard("{Escape}")
    expect(document.activeElement).toBe(menu)
    expect(document.body.style.overflow).toBe("")
    await user.click(menu)
    await user.keyboard("{Control>}k{/Control}")
    expect(screen.queryByRole("dialog", { name: "Docs navigation menu" })).toBeNull()
    const search = screen.getByRole("dialog", { name: "Search" })
    expect(document.activeElement).toBe(within(search).getByRole("textbox"))
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.body.style.overflow).toBe("")
  })

  it("keeps static outlines in SSR and discovers component headings after hydration", async () => {
    const html = renderToStaticMarkup(domPage())
    expect(html).toContain('href="#static"')
    expect(html).not.toContain('href="#detail"')
    const view = render(domPage())
    expect(await screen.findByRole("link", { name: "Component heading" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Component detail" }).getAttribute("href")).toBe(
      "#detail"
    )
    expect(screen.queryByRole("link", { name: "Example output" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Navigation heading" })).toBeNull()
    const link = screen.getByRole("link", { name: "Component heading" })
    const heading = screen.getByRole("heading", { name: "Component heading" })
    expect(link.getAttribute("href")).toBe(`#${heading.id}`)
    expect(heading.id).not.toBe("")
    view.rerender(domPage(true))
    expect(await screen.findByRole("link", { name: "Late heading" })).toBeTruthy()
    await act(async () => {
      view.rerender(domPage(false))
    })
    expect(screen.queryByRole("link", { name: "Late heading" })).toBeNull()
    expect(heading.id).toBe(link.getAttribute("href")?.slice(1))
  })

  it("owns mobile state when uncontrolled and cleans up after navigation and unmount", async () => {
    const user = userEvent.setup()
    const navigation = (
      <ArdoMobileNavigation>
        <a href="/next/">Next page</a>
      </ArdoMobileNavigation>
    )
    const view = render(<Page>{navigation}</Page>)
    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.getByRole("dialog")).toBeTruthy()
    view.rerender(<Page path="/next">{navigation}</Page>)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.body.style.overflow).toBe("")
    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    view.unmount()
    expect(document.body.style.overflow).toBe("")
  })

  it("can build a DOM outline without Markdown metadata and follow renamed headings", async () => {
    render(
      <ArdoPageProvider>
        <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
          <h2 id="outside">Outside the scope</h2>
          <section id="scoped">
            <h2 id="authored">A component title</h2>
            <h2 hidden>Hidden title</h2>
          </section>
          <ArdoTOC source="dom" scope="#scoped" />
        </ArdoProvider>
      </ArdoPageProvider>
    )
    expect(await screen.findByRole("link", { name: "A component title" })).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Outside the scope" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Hidden title" })).toBeNull()
    await act(async () => {
      screen.getByRole("heading", { name: "A component title" }).textContent = "Renamed title"
    })
    expect(await screen.findByRole("link", { name: "Renamed title" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Renamed title" }).getAttribute("href")).toBe(
      "#authored"
    )
    expect(screen.queryByRole("link", { name: "A component title" })).toBeNull()
  })
})
