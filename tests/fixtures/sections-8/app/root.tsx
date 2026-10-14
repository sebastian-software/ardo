import type { ReactNode } from "ardo/react"
import {
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoRoot,
  ArdoRootLayout,
  ArdoSidebar,
  ArdoSocialLink,
} from "ardo/ui"
import config from "virtual:ardo/config"
import type { MetaFunction } from "ardo/router"
import "ardo/ui/styles.css"

export const meta: MetaFunction = () => [{ title: "Eight Sections" }]

export function Layout({ children }: { children: ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

// Eight sections, including one folder (notes) that the catalog does not know.
export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader>
        <ArdoHeaderActions>
          <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
        </ArdoHeaderActions>
      </ArdoHeader>

      <ArdoSidebar />

      <ArdoFooter message="Section tabs fixture" />
    </ArdoRoot>
  )
}
