// @vitest-environment jsdom
import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ArdoConfig } from "../config/types"

import { resolveConfig } from "../config"
import { createClientRoutesModule, createRoutesModule } from "../vite/routes-plugin"
import { loadVirtualModule } from "../vite/virtual-modules"
import { ArdoApp } from "./app"
import { ArdoLink, ArdoOutlet } from "./page"
import { resolvePage, type ArdoRootModule } from "./routing"

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const roots: string[] = []
afterEach(async () => {
  vi.restoreAllMocks()
  document.body.innerHTML = ""
  for (const directory of roots.splice(0)) await fs.rm(directory, { recursive: true, force: true })
})

const root: ArdoRootModule = {
  default: () => (
    <main>
      <ArdoOutlet />
    </main>
  ),
}

/**
 * Generate the modules a site gets: the client route module, the server route
 * table, and the client config. Each side parses its own copy, as the server
 * and the browser do.
 */
async function generateSite(files: string[], options: Omit<ArdoConfig, "title">) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-hydration-"))
  roots.push(directory)
  const routesDir = path.join(directory, "app/routes")
  for (const file of files) {
    await fs.mkdir(path.dirname(path.join(routesDir, file)), { recursive: true })
    await fs.writeFile(path.join(routesDir, file), "# Page\n")
  }
  const resolved = resolveConfig({ title: "Hydration", buildHash: "", ...options }, directory)
  const clientRoutes = createClientRoutesModule({ routesDir })
  const clientConfig =
    (await loadVirtualModule("\0virtual:ardo/config", { resolvedConfig: resolved, routesDir })) ??
    ""
  const table = createRoutesModule({ root: directory, routesDir, config: resolved })
  const publicPaths = new Map(
    [...table.matchAll(/logicalPath: ("[^"]*"), publicPath: ("[^"]*")/gu)].map(
      ([, logical, publicPath]) => [JSON.parse(logical ?? ""), JSON.parse(publicPath ?? "")]
    )
  )
  const side = () => ({
    // Both generated modules export a JSON literal.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    config: JSON.parse(clientConfig.replace(/^export default /u, "")) as ArdoConfig,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    paths: JSON.parse(/^export const paths = (.*)$/mu.exec(clientRoutes)?.[1] ?? "") as string[],
  })
  return { publicPaths, side }
}

/** Render a page on the "server", then hydrate it with the client's own copies of the data. */
async function hydratePage(
  site: Awaited<ReturnType<typeof generateSite>>,
  pagePath: string,
  { clientPaths, links }: { clientPaths?: string[]; links: string[] }
) {
  const Page = () => (
    <nav>
      {links.map((to) => (
        <ArdoLink key={to} to={to}>
          {to}
        </ArdoLink>
      ))}
    </nav>
  )
  const render = async ({ config, paths }: ReturnType<typeof site.side>) => {
    const page = await resolvePage({
      base: config.base ?? "/",
      path: pagePath,
      root,
      route: { id: `app/routes${pagePath}.md`, load: async () => ({ default: Page }) },
    })
    return <ArdoApp config={config} page={page} paths={paths} root={root} />
  }
  const container = document.createElement("div")
  container.innerHTML = renderToString(await render(site.side()))
  document.body.append(container)
  const errors: unknown[] = []
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => errors.push(args))
  const client = site.side()
  const element = await render(clientPaths == null ? client : { ...client, paths: clientPaths })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const app = await act(async () =>
    hydrateRoot(container, element, { onRecoverableError: (error) => errors.push(error) })
  )
  const hrefs = [...container.querySelectorAll("a")].map((anchor) => anchor.getAttribute("href"))
  await act(async () => app.unmount())
  return { errors, hrefs }
}

const versioning = {
  current: "v6",
  directories: ["guide"],
  versions: [{ id: "v6", path: "/v6/" }],
}

describe("hydration with link data from the generated client routes", () => {
  it("hydrates a versioned page without a mismatch", async () => {
    const site = await generateSite(["guide/intro.md", "guide/release-6.0.md", "news/launch.md"], {
      base: "/project/",
      versioning,
    })
    const { errors, hrefs } = await hydratePage(site, "/news/launch", {
      links: ["/guide/intro", "/guide/release-6.0", "/news/launch"],
    })
    expect(errors).toStrictEqual([])
    expect(hrefs).toStrictEqual([
      `${site.publicPaths.get("/guide/intro")}/`,
      `${site.publicPaths.get("/guide/release-6.0")}/`,
      `${site.publicPaths.get("/news/launch")}/`,
    ])
    expect(hrefs[0]).toBe("/project/v6/guide/intro/")
  })

  it("hydrates a localized page without a mismatch", async () => {
    const site = await generateSite(
      ["en/guide/intro.md", "de/guide/intro.md", "de/news/launch.md"],
      {
        base: "/project/",
        versioning,
        i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
      }
    )
    const { errors, hrefs } = await hydratePage(site, "/de/news/launch", {
      links: ["/guide/intro", "/en/guide/intro", "/news/launch"],
    })
    expect(errors).toStrictEqual([])
    expect(hrefs).toStrictEqual([
      `${site.publicPaths.get("/de/guide/intro")}/`,
      `${site.publicPaths.get("/en/guide/intro")}/`,
      `${site.publicPaths.get("/de/news/launch")}/`,
    ])
    expect(hrefs[0]).toBe("/project/v6/de/guide/intro/")
  })

  it("reports a mismatch when the client derives other link data", async () => {
    const site = await generateSite(["guide/intro.md", "news/launch.md"], {
      base: "/project/",
      versioning,
    })
    const { errors } = await hydratePage(site, "/news/launch", {
      clientPaths: ["/news/launch"],
      links: ["/guide/intro"],
    })
    expect(errors).not.toStrictEqual([])
  })
})
