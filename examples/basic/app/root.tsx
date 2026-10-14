import type { ReactNode } from "ardo/react"
import { ArdoFooter, ArdoHeader, ArdoRoot, ArdoRootLayout, ArdoSidebar } from "ardo/ui"
import config from "virtual:ardo/config"
import type { MetaFunction } from "ardo/router"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [{ title: "Ardo Basic Example" }]

export function Layout({ children }: { children: ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader />

      <ArdoSidebar />

      <ArdoFooter message="Built with Ardo" />
    </ArdoRoot>
  )
}
