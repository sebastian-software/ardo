import {
  ArdoErrorBoundary,
  ArdoRootLayout,
  ArdoRoot,
  ArdoFooter,
  ArdoSocialLink,
  registerIcons,
} from "ardo/ui"
import { Code2, Rocket, Zap } from "lucide-react"
import config from "virtual:ardo/config"
import sidebars from "virtual:ardo/sidebars"
import logo from "./assets/logo.svg"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"

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
      sidebar={sidebars}
      contexts={[
        { id: "guide", label: "Guide", href: "/guide/getting-started" },
        { id: "api-reference", label: "API", href: "/api-reference" },
      ]}
      editLink={{
        pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
        text: "Edit this page on GitHub",
      }}
      lastUpdated={{
        enabled: true,
        text: "Last updated",
      }}
      headerProps={{
        logo,
        searchPlaceholder: "Search documentation...",
        actions: <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />,
      }}
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
