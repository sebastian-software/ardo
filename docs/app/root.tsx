import type { ArdoMetaFunction } from "ardo/runtime"
import {
  ArdoErrorBoundary,
  ArdoRoot,
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoSidebar,
  ArdoSocialLink,
  type ArdoThemeProps,
} from "ardo/ui"
import "./theme.css"

import logo from "./assets/logo.svg"

export const meta: ArdoMetaFunction = () => [
  { title: "Ardo" },
  { name: "description", content: "Documentation for React teams" },
]

export const ErrorBoundary = ArdoErrorBoundary

// The owl palette from the logo: olive brand, terracotta accent, and a barely
// warm off-white. The owl colors are calmer than Ardo's default, so chroma turns
// the brand down and the accent up; Ardo derives everything else.
const theme: ArdoThemeProps = {
  color: 123, // olive, the owl's body
  accent: 38, // terracotta, the owl's wing
  neutral: 95, // a barely warm off-white
  chroma: { color: 0.4, accent: 2, neutral: 1.6 },
  // Warnings take the owl's mustard, so they don't read as the accent.
  status: { warning: 72 },
  // Code sits on the off-white instead of a terracotta tint.
  light: { color: { codeBg: "oklch(0.973 0.006 95)", codeBorder: "oklch(0.9 0.009 95)" } },
  dark: { color: { codeBg: "oklch(0.205 0.01 95)", codeBorder: "oklch(0.31 0.014 95)" } },
}

export default function Root() {
  return (
    <ArdoRoot
      theme={theme}
      logo={logo}
      editLink={{
        pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
        text: "Edit this page on GitHub",
      }}
      lastUpdated={{
        enabled: true,
        text: "Last updated",
      }}
    >
      <ArdoHeader searchPlaceholder="Search documentation...">
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
