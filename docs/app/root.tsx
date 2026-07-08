import {
  ArdoErrorBoundary,
  ArdoRootLayout,
  ArdoRoot,
  ArdoFooter,
  ArdoGeneratedSidebar,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoNav,
  ArdoNavLink,
  ArdoOwlMark,
  ArdoSidebar,
  ArdoSidebarSection,
  ArdoSocialLink,
  registerIcons,
} from "ardo/ui"
import { Code2, Rocket, Zap } from "lucide-react"
import config from "virtual:ardo/config"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"

// Brand-tinted owl mark. It draws in currentColor, so it follows the live
// --ardo-color-brand across light/dark themes and any custom brand hue.
const brandLogo = (
  <ArdoOwlMark size={30} title="Ardo" style={{ color: "var(--ardo-color-brand)" }} />
)

registerIcons({ Code2, Rocket, Zap })

export const meta: MetaFunction = () => [
  { title: "Ardo" },
  { name: "description", content: "Documentation for React teams" },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export const ErrorBoundary = ArdoErrorBoundary

export default function Root() {
  return (
    <ArdoRoot
      config={config}
      editLink={{
        pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
        text: "Edit this page on GitHub",
      }}
      lastUpdated={{
        enabled: true,
        text: "Last updated",
      }}
    >
      <ArdoHeader logo={brandLogo} searchPlaceholder="Search documentation...">
        <ArdoNav>
          <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
          <ArdoNavLink to="/api-reference">API</ArdoNavLink>
        </ArdoNav>
        <ArdoHeaderActions>
          <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
        </ArdoHeaderActions>
      </ArdoHeader>

      <ArdoSidebar>
        <ArdoSidebarSection
          id="guide"
          label="Guide"
          to="/guide/getting-started"
          icon={<Rocket size={18} strokeWidth={1.8} />}
        >
          <ArdoGeneratedSidebar section="guide" />
        </ArdoSidebarSection>
        <ArdoSidebarSection
          id="api-reference"
          label="API"
          to="/api-reference"
          icon={<Code2 size={18} strokeWidth={1.8} />}
        >
          <ArdoGeneratedSidebar section="api-reference" />
        </ArdoSidebarSection>
      </ArdoSidebar>

      <ArdoFooter
        sponsor={{ text: "Sebastian Software", link: "https://sebastian-software.com/oss" }}
        message="Released under the MIT License."
        copyright="Copyright 2026 Sebastian Software GmbH"
      />
    </ArdoRoot>
  )
}
