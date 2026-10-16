import {
  ArdoErrorBoundary,
  ArdoRootLayout,
  ArdoRoot,
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoSidebar,
  ArdoSocialLink,
  registerIcons,
} from "ardo/ui"
import { Code2, Rocket, Zap } from "lucide-react"
import config from "virtual:ardo/config"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"
import "./theme.css"

import logo from "./assets/logo.svg"

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
      <ArdoHeader logo={logo} searchPlaceholder="Search documentation...">
        <ArdoHeaderActions>
          <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
        </ArdoHeaderActions>
      </ArdoHeader>

      {/* Sections come from the top-level route folders: guide, api-reference. */}
      <ArdoSidebar />

      <ArdoFooter
        sponsor={{ text: "Sebastian Software", link: "https://oss.sebastian-software.com" }}
        message={
          <>
            Code under the MIT License. Icons by <a href="https://streamlinehq.com">Streamline</a>.
            Logos belong to their projects.
          </>
        }
        copyright={
          <>
            © 2026 Sebastian Software GmbH, Mainz, Germany ·{" "}
            <a href="https://sebastian-software.com/imprint">Imprint</a> ·{" "}
            <a href="https://sebastian-software.com/privacy-policy">Privacy</a>
          </>
        }
      />
    </ArdoRoot>
  )
}
