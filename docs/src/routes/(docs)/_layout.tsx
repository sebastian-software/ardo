import { createFileRoute, Outlet } from '@tanstack/react-router'
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
} from 'ardo/theme'
import { PressProvider } from 'ardo/runtime'
import config from 'virtual:ardo/config'
import sidebar from 'virtual:ardo/sidebar'

export const Route = createFileRoute('/(docs)/_layout')({
  component: DocsLayout,
})

/**
 * JSX-first layout for documentation pages.
 */
function DocsLayout() {
  return (
    <PressProvider config={config} sidebar={sidebar}>
      <Layout
        header={
          <Header
            logo="/logo.svg"
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
            actions={
              <SocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
            }
          />
        }
        sidebar={
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
            </SidebarGroup>

            <SidebarGroup title="Customization">
              <SidebarLink to="/guide/theme-config">Theme Config</SidebarLink>
              <SidebarLink to="/guide/custom-theme">Custom Theme</SidebarLink>
            </SidebarGroup>

            <SidebarGroup title="Advanced">
              <SidebarLink to="/guide/typedoc">TypeDoc Integration</SidebarLink>
              <SidebarLink to="/guide/troubleshooting">Troubleshooting</SidebarLink>
            </SidebarGroup>

            <SidebarLink to="/api-reference">API Reference</SidebarLink>
          </Sidebar>
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
