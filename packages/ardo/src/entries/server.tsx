import type { ReactNode } from "react"

import { prerender } from "react-dom/static"
import { paths } from "virtual:ardo/client-routes"
import virtualConfig from "virtual:ardo/config"
import { rootModule, routes } from "virtual:ardo/routes"

import type { ResolvedConfig } from "../config/types"

import { ArdoApp } from "../runtime/app"
import { ArdoDocumentProvider } from "../runtime/document"
import { type ArdoDocumentIcons, ArdoDocumentIconsContext } from "../runtime/document-context"
import { resolveNavigationHead } from "../runtime/navigation"
import {
  ARDO_APP_ELEMENT_ID,
  ARDO_PAGE_DATA_ATTRIBUTE,
  type ArdoPageData,
  type ArdoRootModule,
  isDynamicRoute,
  matchRoute,
  resolvePage,
} from "../runtime/routing"
import { spellPagePath } from "../runtime/trailing-slash"
import { ArdoRootLayout } from "../ui/Layout"

/** The full route table, which only the server entry carries; the client gets its logical paths. */
export { routes }

export type ArdoRenderAssets = {
  entry: string
  modulePreloads: string[]
  /**
   * URL of the page's own module chunk, also one of `modulePreloads`. The
   * client imports it directly; without it, the client loads the page through
   * the lazily imported loader table.
   */
  page?: string
  stylesheets: string[]
}

export type ArdoRenderOptions = {
  assets: (routeId: string | undefined) => ArdoRenderAssets
  base: string
  /** Render the not-found page instead of looking up a route. */
  notFound?: boolean
}

export type ArdoRenderResult = { html: string; routeId?: string; status: number }

/** Paths of every route that has a single page to prerender. */
export function getStaticPaths(): string[] {
  return routes.filter((route) => !isDynamicRoute(route)).map((route) => route.path)
}

/** Render a complete HTML document for a page path without the base path. */
export async function renderPage(
  path: string,
  options: ArdoRenderOptions
): Promise<ArdoRenderResult> {
  const config: ResolvedConfig = virtualConfig
  const root: ArdoRootModule = rootModule
  // `/guide/` and `/guide` are the same page; components see one path.
  const pagePath = path.length > 1 ? path.replace(/\/+$/u, "") : path
  const route = options.notFound === true ? undefined : matchRoute(routes, pagePath)
  const page = await resolvePage({
    base: options.base,
    path: pagePath,
    root,
    route,
    siteTitle: config.title,
  })
  if (config.agentDiscoveryUrl !== undefined) {
    page.meta.push({ tagName: "link", rel: "ard", href: config.agentDiscoveryUrl })
  }
  const assets = options.assets(page.data.routeId)
  const Layout = root.Layout ?? ArdoRootLayout
  const navigation = resolveNavigationHead(config.navigation, {
    deploymentBase: config.deploymentBase,
    dev: import.meta.env.DEV,
  })

  const locale = applyLocaleMetadata(page, config, {
    path: page.data.path,
    base:
      route?.publicPath == null
        ? options.base
        : `${route.publicPath.replace(/\/$/u, "").slice(0, -page.data.path.length)}/`,
  })
  const { body, icons } = await renderWithIcons(
    // The client derives its links from the same logical paths.
    <ArdoApp config={config} page={page} paths={paths} root={root} />
  )
  const shell = await renderToHtml(
    <ArdoDocumentProvider
      value={{
        entry: assets.entry,
        meta: page.meta,
        modulePreloads: assets.modulePreloads,
        stylesheets: assets.stylesheets,
        lang: locale ?? config.lang,
        iconBasePath: config.deploymentBase,
        ...(navigation === undefined ? {} : { navigation }),
        ...icons,
      }}
    >
      <Layout>
        <div
          id={ARDO_APP_ELEMENT_ID}
          style={{ display: "contents" }}
          {...{ [ARDO_PAGE_DATA_ATTRIBUTE]: serializePageData(page.data, assets) }}
        />
      </Layout>
    </ArdoDocumentProvider>
  )
  const html = insertAppHtml(shell, body)
  return {
    html: html.startsWith("<!DOCTYPE") ? html : `<!DOCTYPE html>${html}`,
    routeId: page.data.routeId,
    status: page.error == null ? 200 : (page.data.error?.status ?? 500),
  }
}

/** Page data for the client, with the URL of the page's own chunk when the build has one. */
function serializePageData(data: ArdoPageData, assets: ArdoRenderAssets): string {
  return JSON.stringify(assets.page == null ? data : { ...data, module: assets.page })
}

/** Render to a complete HTML string, waiting for every suspended component. */
async function renderToHtml(element: ReactNode): Promise<string> {
  const { prelude } = await prerender(element)
  return new Response(prelude).text()
}

/** Place the separately rendered page inside the shell's empty app element. */
function insertAppHtml(shell: string, body: string): string {
  const start = shell.indexOf(`<div id="${ARDO_APP_ELEMENT_ID}"`)
  const end = start === -1 ? -1 : shell.indexOf("></div>", start)
  if (end === -1) {
    throw new Error("[ardo] The root Layout must render the page it receives as children.")
  }
  const openTagEnd = end + 1
  return `${shell.slice(0, openTagEnd)}${body}${shell.slice(openTagEnd)}`
}

function applyLocaleMetadata(
  page: Awaited<ReturnType<typeof resolvePage>>,
  config: ResolvedConfig,
  { path, base }: { path: string; base: string }
): string | undefined {
  const locale =
    config.i18n === false
      ? undefined
      : config.i18n.locales.find((entry) => entry.id === path.split("/")[1])?.id
  if (
    locale != null &&
    page.error == null &&
    config.i18n !== false &&
    config.siteUrl != null &&
    config.siteUrl !== ""
  ) {
    const routePath = path.slice(locale.length + 1) || "/"
    const href = (id: string) =>
      new URL(
        spellPagePath(`${base}${id}${routePath}`, config.trailingSlash, config.deploymentBase),
        config.siteUrl
      ).href
    if (!page.meta.some((meta) => "rel" in meta && meta.rel === "canonical")) {
      page.meta.push({ tagName: "link", rel: "canonical", href: href(locale) })
    }
    page.meta.push(
      ...config.i18n.locales.map(({ id }) => ({
        tagName: "link" as const,
        rel: "alternate",
        hrefLang: id,
        href: href(id),
      })),
      {
        tagName: "link",
        rel: "alternate",
        hrefLang: "x-default",
        href: href(config.i18n.defaultLocale),
      }
    )
  }
  return locale
}

async function renderWithIcons(element: ReactNode) {
  let icons: ArdoDocumentIcons = {}
  const body = await renderToHtml(
    <ArdoDocumentIconsContext
      value={(value) => {
        icons = value
      }}
    >
      {element}
    </ArdoDocumentIconsContext>
  )
  return { body, icons }
}
