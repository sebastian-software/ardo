import type { ReactNode } from "ardo/react"

import { type ArdoMetaFunction, useArdoPath } from "ardo/runtime"
import {
  ArdoFooter,
  ArdoGeneratedSidebar,
  ArdoHeader,
  ArdoNav,
  ArdoNavLink,
  ArdoRoot,
  ArdoRootLayout,
  ArdoSidebar,
  ArdoSidebarSection,
} from "ardo/ui"
import "./document-scroll.css"

export const meta: ArdoMetaFunction = () => [{ title: "Ardo Basic Example" }]

export function Layout({ children }: { children: ReactNode }) {
  return <ArdoRootLayout className="document-scroll-test">{children}</ArdoRootLayout>
}

export default function Root() {
  const currentPathname = useArdoPath()
  const pathname =
    currentPathname.length > 1 && currentPathname.endsWith("/")
      ? currentPathname.slice(0, -1)
      : currentPathname
  const isDocumentScrollPage = pathname === "/guide/document-scroll"

  return (
    <>
      {isDocumentScrollPage && (
        <header className="document-scroll-header">
          <a className="document-scroll-skip-link" href="#main-content">
            Skip to content
          </a>
          <span>Runtime docs site</span>
        </header>
      )}

      <ArdoRoot
        className={isDocumentScrollPage ? "document-scroll-custom-layout" : undefined}
        scrollMode={isDocumentScrollPage ? "document" : undefined}
      >
        <ArdoHeader>
          <ArdoNav>
            <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
          </ArdoNav>
        </ArdoHeader>

        <ArdoSidebar>
          <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
            <ArdoGeneratedSidebar section="guide" />
          </ArdoSidebarSection>
        </ArdoSidebar>

        <ArdoFooter message="Built with Ardo" />
      </ArdoRoot>

      {isDocumentScrollPage && <footer data-testid="external-site-footer">Site footer</footer>}
    </>
  )
}
