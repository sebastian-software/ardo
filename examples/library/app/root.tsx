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
import config from "virtual:ardo/config"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [{ title: "Ardo Library Example" }]

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader>
        <ArdoNav>
          <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
          <ArdoNavLink to="/api-reference">API</ArdoNavLink>
        </ArdoNav>
      </ArdoHeader>

      <ArdoSidebar>
        <ArdoSidebarSection id="guide" label="Guide" to="/guide/getting-started">
          <ArdoGeneratedSidebar section="guide" />
        </ArdoSidebarSection>
        <ArdoSidebarSection id="api-reference" label="API" to="/api-reference">
          <ArdoGeneratedSidebar section="api-reference" />
        </ArdoSidebarSection>
      </ArdoSidebar>

      <ArdoFooter message="Built with Ardo" />
    </ArdoRoot>
  )
}
