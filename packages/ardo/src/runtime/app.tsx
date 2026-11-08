import { type ReactNode, StrictMode, useMemo } from "react"

import type { ArdoConfig } from "../config/types"
import type { ArdoResolvedPage, ArdoRootModule } from "./routing"

import { createRouteHrefs, getRouteLinks } from "../shared/route-links"

import { ArdoConfigProvider } from "./hooks"
import { ArdoPageProvider } from "./page"
import { isArdoNotFound } from "./page-context"
import { ArdoRouteHrefsContext, ArdoRoutePathsContext } from "./route-paths"

/**
 * The part of the page that hydrates: the root component around the page. A
 * missing page renders inside the root like any other page. A render error
 * replaces the root, so a broken site chrome cannot hide the error.
 */
export function ArdoPageTree({ config, page, root }: ArdoAppProps) {
  const keepsRoot = page.error == null || isArdoNotFound(page.error)
  const Root = keepsRoot ? (root.default ?? DefaultRoot) : page.component
  const tree = (
    <ArdoPageProvider
      base={page.data.base}
      component={page.component}
      error={page.error}
      handle={page.handle}
      path={page.data.path}
      source={page.source}
    >
      <Root />
    </ArdoPageProvider>
  )
  return config == null ? tree : <ArdoConfigProvider config={config}>{tree}</ArdoConfigProvider>
}

/**
 * The React root both sides render. The server renders it on its own, so ids
 * from `useId` match what the client hydrates.
 *
 * `paths` holds the logical path of every route, from
 * `virtual:ardo/client-routes`. Both sides derive the link data from it with
 * the same function, so rendered `href`s match during hydration.
 */
export function ArdoApp({
  config,
  page,
  paths,
  root,
}: ArdoAppProps & { paths: readonly string[] }) {
  const routePaths = useMemo(() => getRouteLinks(paths, config).paths, [paths, config])
  const hrefs = useMemo(
    () => createRouteHrefs(paths, config, page.data.path),
    [paths, config, page.data.path]
  )
  return (
    <ArdoRoutePathsContext value={routePaths}>
      <ArdoRouteHrefsContext value={hrefs}>
        <StrictMode>
          <ArdoPageTree config={config} page={page} root={root} />
        </StrictMode>
      </ArdoRouteHrefsContext>
    </ArdoRoutePathsContext>
  )
}

type ArdoAppProps = {
  /** The site config from `virtual:ardo/config`; Ardo's entries always pass it. */
  config?: ArdoConfig
  page: ArdoResolvedPage
  root: ArdoRootModule
}

function DefaultRoot(): ReactNode {
  throw new Error(
    "[ardo] app/root.tsx must export a default root component. Delete the file to use <ArdoRoot />."
  )
}
