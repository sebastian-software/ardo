// @vitest-environment jsdom

import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ArdoRootModule, ArdoRouteEntry } from "./routing"

import { ArdoApp } from "./app"
import { ArdoOutlet } from "./page"
import { useArdoPage } from "./page-context"
import { matchRoute, resolvePage } from "./routing"

// A custom shell: the root reads the page's frontmatter itself, without ArdoProvider.
const root: ArdoRootModule = {
  default: function Root() {
    const counterpart = useArdoPage().frontmatter?.counterpart
    return (
      <main>
        {typeof counterpart === "string" && (
          <a data-counterpart href={counterpart}>
            Deutsch
          </a>
        )}
        <ArdoOutlet />
      </main>
    )
  },
}

// Shaped like a generated tag route: its frontmatter is computed from its own tag at render time.
function tagRoute(key: string): ArdoRouteEntry {
  const tag = Object.freeze({ key, path: `/news/tags/${key}` })
  return {
    id: `app/routes/news/tags/${key}/index.tsx`,
    path: tag.path,
    load: async () => ({
      default: () => <h1>{tag.key}</h1>,
      frontmatter: () => ({ counterpart: `/de/journal/schlagworte/${tag.key}/` }),
    }),
  }
}

afterEach(() => {
  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

describe("page frontmatter computed by a route", () => {
  it("reaches the root on the server and after hydration, per route", async () => {
    const routes = [tagRoute("design"), tagRoute("process")]
    const paths = routes.map((route) => route.path)
    for (const key of ["design", "process"]) {
      const path = `/news/tags/${key}`
      const server = await resolvePage({ base: "/", path, root, route: matchRoute(routes, path) })
      const container = document.createElement("div")
      document.body.append(container)
      container.innerHTML = renderToString(<ArdoApp page={server} paths={paths} root={root} />)
      expect(container.querySelector("[data-counterpart]")?.getAttribute("href")).toBe(
        `/de/journal/schlagworte/${key}/`
      )

      // The client entry resolves the page again from the serialized page data.
      const client = await resolvePage({
        ...server.data,
        root,
        route: routes.find((entry) => entry.id === server.data.routeId),
      })
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        /* React reports hydration mismatches here; the assertion below names them. */
      })
      const recoverable: unknown[] = []
      await act(async () => {
        hydrateRoot(container, <ArdoApp page={client} paths={paths} root={root} />, {
          onRecoverableError: (error) => recoverable.push(error),
        })
      })
      expect(recoverable).toStrictEqual([])
      expect(consoleError).not.toHaveBeenCalled()
      expect(container.querySelector("[data-counterpart]")?.getAttribute("href")).toBe(
        `/de/journal/schlagworte/${key}/`
      )
    }
  })
})
