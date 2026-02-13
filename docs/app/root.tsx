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
  SocialLink,
} from "ardo/ui"
import { ArdoProvider } from "ardo/runtime"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import logo from "./assets/logo.svg"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [
  { title: "Ardo" },
  { name: "description", content: "Documentation for React teams" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href={logo} />
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
            logo={logo}
            title="Ardo"
            nav={
              <Nav>
                <NavLink to="/guide/getting-started">Guide</NavLink>
                <NavLink to="/api-reference">API</NavLink>
                <NavLink to="/showcase">Showcase</NavLink>
                <NavLink href="https://github.com/sebastian-software/ardo/blob/main/packages/ardo/CHANGELOG.md">
                  Changelog
                </NavLink>
                <NavLink href="https://github.com/sebastian-software/ardo">GitHub</NavLink>
              </Nav>
            }
            actions={<SocialLink href="https://github.com/sebastian-software/ardo" icon="github" />}
          />
        }
        sidebar={
          isHomePage ? undefined : (
            <Sidebar>
              <SidebarGroup title="Introduction">
                <SidebarLink to="/guide/what-is-ardo">What is Ardo?</SidebarLink>
                <SidebarLink to="/guide/comparison">Comparison</SidebarLink>
                <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Writing">
                <SidebarLink to="/guide/markdown">Markdown Features</SidebarLink>
                <SidebarLink to="/guide/frontmatter">Frontmatter</SidebarLink>
                <SidebarLink to="/guide/typedoc">TypeDoc Integration</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Customization">
                <SidebarLink to="/guide/configuration">Configuration</SidebarLink>
                <SidebarLink to="/guide/theme-config">Theme Config</SidebarLink>
                <SidebarLink to="/guide/custom-theme">Custom Theme</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Deploy & Troubleshoot">
                <SidebarLink to="/guide/deployment">Deployment</SidebarLink>
                <SidebarLink to="/guide/troubleshooting">Troubleshooting</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="API Reference" to="/api-reference" collapsed>
                <SidebarLink to="/api-reference/components">Components</SidebarLink>
                <SidebarLink to="/api-reference/functions">Functions</SidebarLink>
                <SidebarLink to="/api-reference/interfaces">Interfaces</SidebarLink>
                <SidebarLink to="/api-reference/types">Types</SidebarLink>
                <SidebarLink to="/api-reference/classes">Classes</SidebarLink>
              </SidebarGroup>
            </Sidebar>
          )
        }
        footer={
          <Footer
            project={config.project}
            sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
            buildTime={config.buildTime}
            message="Released under the MIT License."
            copyright="Copyright 2026 Sebastian Software GmbH"
          />
        }
      >
        <Outlet />
      </ArdoLayout>
    </ArdoProvider>
  )
}
