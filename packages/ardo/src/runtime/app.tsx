import { type ReactNode, StrictMode } from "react"

import type { ArdoResolvedPage, ArdoRootModule } from "./routing"

import { ArdoPageProvider } from "./page"
import { isArdoNotFound } from "./page-context"

/**
 * The part of the page that hydrates: the root component around the page. A
 * missing page renders inside the root like any other page. A render error
 * replaces the root, so a broken site chrome cannot hide the error.
 */
export function ArdoPageTree({ page, root }: { page: ArdoResolvedPage; root: ArdoRootModule }) {
  const keepsRoot = page.error == null || isArdoNotFound(page.error)
  const Root = keepsRoot ? (root.default ?? DefaultRoot) : page.component
  return (
    <ArdoPageProvider
      base={page.data.base}
      component={page.component}
      error={page.error}
      handle={page.handle}
      path={page.data.path}
    >
      <Root />
    </ArdoPageProvider>
  )
}

/**
 * The React root both sides render. The server renders it on its own, so ids
 * from `useId` match what the client hydrates.
 */
export function ArdoApp({ page, root }: { page: ArdoResolvedPage; root: ArdoRootModule }) {
  return (
    <StrictMode>
      <ArdoPageTree page={page} root={root} />
    </StrictMode>
  )
}

function DefaultRoot(): ReactNode {
  throw new Error("[ardo] app/root.tsx must export a default root component.")
}
