import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router"
import {
  Layout as ArdoLayout,
  Header,
  Nav,
  NavLink,
  Sidebar,
  SidebarGroup,
  SidebarLink,
  Footer,
} from "ardo/ui"
import { ArdoProvider } from "ardo/runtime"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [
  { title: "{{SITE_TITLE}}" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  const location = useLocation()
  const isHomePage = location.pathname === "/"

  return (
    <ArdoProvider config={config} sidebar={sidebar}>
      <ArdoLayout
        className={isHomePage ? "ardo-layout ardo-home" : "ardo-layout"}
        header={
          <Header
            nav={
              <Nav>
                <NavLink to="/guide/getting-started">Guide</NavLink>
                {{TYPEDOC_NAVLINK}}
              </Nav>
            }
          />
        }
        sidebar={
          isHomePage ? undefined : (
            <Sidebar>
              <SidebarGroup title="Guide">
                <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
              </SidebarGroup>
              {{TYPEDOC_SIDEBARLINK}}
            </Sidebar>
          )
        }
        footer={<Footer />}
      >
        <Outlet />
      </ArdoLayout>
    </ArdoProvider>
  )
}
