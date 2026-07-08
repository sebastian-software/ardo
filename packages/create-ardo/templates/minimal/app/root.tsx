import {
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
import "./app.css"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [{ title: config.title }]

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot config={config}>
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
    </ArdoRoot>
  )
}
