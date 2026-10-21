import type { ArdoMetaFunction } from "ardo/runtime"
import { ArdoFooter, ArdoHeader, ArdoRoot, ArdoSidebar } from "ardo/ui"
import config from "virtual:ardo/config"
import "ardo/ui/styles.css"

export const meta: ArdoMetaFunction = () => [{ title: "Ardo Basic Example" }]

export default function Root() {
  return (
    <ArdoRoot config={config}>
      <ArdoHeader />

      <ArdoSidebar />

      <ArdoFooter />
    </ArdoRoot>
  )
}
