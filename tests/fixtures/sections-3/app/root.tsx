import {
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoRoot,
  ArdoSidebar,
  ArdoSocialLink,
} from "ardo/ui"
import config from "virtual:ardo/config"
import type { ArdoMetaFunction } from "ardo/runtime"
import "ardo/ui/styles.css"

export const meta: ArdoMetaFunction = () => [{ title: "Three Sections" }]

// Three sections like Ferroni: guide, perf and adr.
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
