import { ArdoRootLayout, ArdoRoot } from "ardo/ui"
import config from "virtual:ardo/config"
import sidebar from "virtual:ardo/sidebar"
import type { MetaFunction } from "react-router"
import "ardo/ui/styles.css"
import "./theme.css"

export const meta: MetaFunction = () => [{ title: "Ardo Library Example" }]

export function Layout({ children }: { children: React.ReactNode }) {
  return <ArdoRootLayout>{children}</ArdoRootLayout>
}

export default function Root() {
  return <ArdoRoot config={config} sidebar={sidebar} />
}
