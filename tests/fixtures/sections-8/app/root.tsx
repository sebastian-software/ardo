import {
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoRoot,
  ArdoSidebar,
  ArdoSocialLink,
} from "ardo/ui"
import type { ArdoMetaFunction } from "ardo/runtime"

export const meta: ArdoMetaFunction = () => [{ title: "Eight Sections" }]

// Eight sections, including one folder (notes) that the catalog does not know.
export default function Root() {
  return (
    <ArdoRoot theme={{ color: "teal" }}>
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
