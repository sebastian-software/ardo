import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router"
import {
  Layout,
  Header,
  Nav,
  NavLink,
  Sidebar,
  SidebarGroup,
  SidebarLink,
  Footer,
  SocialLink,
} from "ardo/ui"
import { PressProvider } from "ardo/runtime"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import logo from "./assets/logo.svg"
import "ardo/ui/styles.css"

export function HtmlDocument({ children }: { children: React.ReactNode }) {
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
    <PressProvider config={config} sidebar={sidebar}>
      <Layout
        className={isHomePage ? "ardo-layout ardo-home" : "ardo-layout"}
        header={
          <Header
            logo={logo}
            title="Ardo"
            nav={
              <Nav>
                <NavLink to="/guide/getting-started">Guide</NavLink>
                <NavLink to="/api-reference">API</NavLink>
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
                <SidebarLink to="/guide/getting-started">Getting Started</SidebarLink>
                <SidebarLink to="/guide/comparison">Framework Comparison</SidebarLink>
                <SidebarLink to="/guide/roadmap">Roadmap</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Writing">
                <SidebarLink to="/guide/markdown">Markdown Features</SidebarLink>
                <SidebarLink to="/guide/frontmatter">Frontmatter</SidebarLink>
                <SidebarLink to="/guide/typedoc">TypeDoc Integration</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Customization">
                <SidebarLink to="/guide/theme-config">Theme Config</SidebarLink>
                <SidebarLink to="/guide/custom-theme">Custom Theme</SidebarLink>
              </SidebarGroup>

              <SidebarGroup title="Deploy & Troubleshoot">
                <SidebarLink to="/guide/deployment">Deployment</SidebarLink>
                <SidebarLink to="/guide/troubleshooting">Troubleshooting</SidebarLink>
              </SidebarGroup>

              <SidebarLink to="/api-reference">API Reference</SidebarLink>
            </Sidebar>
          )
        }
        footer={
          <Footer
            message="Released under the MIT License."
            copyright="Copyright 2026 Sebastian Software GmbH"
          />
        }
      >
        <Outlet />
      </Layout>
    </PressProvider>
  )
}
