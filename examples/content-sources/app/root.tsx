import { ArdoFooter, ArdoHeader, ArdoNav, ArdoNavLink, ArdoRoot, ArdoRootLayout } from "ardo/ui"
import config from "virtual:ardo/config"
import "ardo/ui/styles.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader>
        <ArdoNav>
          <ArdoNavLink to="/catalog">Recipe catalog</ArdoNavLink>
          <ArdoNavLink to="/recipes/quickstart">Generated recipe</ArdoNavLink>
        </ArdoNav>
      </ArdoHeader>
      <ArdoFooter message="Built with Ardo" />
    </ArdoRoot>
  )
}
