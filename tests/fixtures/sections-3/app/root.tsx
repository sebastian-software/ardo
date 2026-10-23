import {
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoRoot,
  ArdoSidebar,
  ArdoSocialLink,
} from "ardo/ui"
import type { ArdoMetaFunction } from "ardo/runtime"

export const meta: ArdoMetaFunction = () => [{ title: "Three Sections" }]

// Three sections like Ferroni: guide, perf and adr.
export default function Root() {
  return (
    <ArdoRoot theme={{ color: "orange" }}>
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
