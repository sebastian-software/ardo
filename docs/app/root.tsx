import {
  ArdoRootLayout,
  ArdoRoot,
  ArdoHeader,
  ArdoNav,
  ArdoNavLink,
  ArdoSidebar,
  ArdoSidebarGroup,
  ArdoSidebarLink,
  ArdoFooter,
  ArdoSocialLink,
} from "ardo/ui"
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
  return <ArdoRootLayout favicon={logo}>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot
      config={config}
      sidebar={sidebar}
      header={
        <ArdoHeader
          logo={logo}
          nav={
            <ArdoNav>
              <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
              <ArdoNavLink to="/api-reference">API</ArdoNavLink>
              <ArdoNavLink to="/showcase">Showcase</ArdoNavLink>
              <ArdoNavLink href="https://github.com/sebastian-software/ardo/blob/main/packages/ardo/CHANGELOG.md">
                Changelog
              </ArdoNavLink>
              <ArdoNavLink href="https://github.com/sebastian-software/ardo">GitHub</ArdoNavLink>
            </ArdoNav>
          }
          actions={
            <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
          }
        />
      }
      sidebarContent={
        <ArdoSidebar>
          <ArdoSidebarGroup title="Introduction">
            <ArdoSidebarLink to="/guide/what-is-ardo">What is Ardo?</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/comparison">Comparison</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/getting-started">Getting Started</ArdoSidebarLink>
          </ArdoSidebarGroup>

          <ArdoSidebarGroup title="Writing">
            <ArdoSidebarLink to="/guide/markdown">Markdown Features</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/frontmatter">Frontmatter</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/typedoc">TypeDoc Integration</ArdoSidebarLink>
          </ArdoSidebarGroup>

          <ArdoSidebarGroup title="Customization">
            <ArdoSidebarLink to="/guide/configuration">Configuration</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/theme-config">Theme Config</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/custom-theme">Custom Theme</ArdoSidebarLink>
          </ArdoSidebarGroup>

          <ArdoSidebarGroup title="Deploy & Troubleshoot">
            <ArdoSidebarLink to="/guide/deployment">Deployment</ArdoSidebarLink>
            <ArdoSidebarLink to="/guide/troubleshooting">Troubleshooting</ArdoSidebarLink>
          </ArdoSidebarGroup>

          <ArdoSidebarGroup title="API Reference" to="/api-reference">
            <ArdoSidebarLink to="/api-reference/components">Components</ArdoSidebarLink>
            <ArdoSidebarLink to="/api-reference/functions">Functions</ArdoSidebarLink>
            <ArdoSidebarLink to="/api-reference/interfaces">Interfaces</ArdoSidebarLink>
            <ArdoSidebarLink to="/api-reference/types">Types</ArdoSidebarLink>
            <ArdoSidebarLink to="/api-reference/classes">Classes</ArdoSidebarLink>
          </ArdoSidebarGroup>
        </ArdoSidebar>
      }
      footer={
        <ArdoFooter
          sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
          message="Released under the MIT License."
          copyright="Copyright 2026 Sebastian Software GmbH"
        />
      }
    />
  )
}
