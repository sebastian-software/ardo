import { t } from "@palamedes/core/macro"
import { Trans } from "@palamedes/react/macro"
import { getI18n } from "@palamedes/runtime"
import { LocalizedContent } from "./i18n/Content"
import { translatedLabels } from "./i18n/labels"

import type { ArdoMetaFunction } from "ardo/runtime"
import {
  ArdoErrorBoundary,
  ArdoRoot,
  ArdoFooter,
  ArdoHeader,
  ArdoHeaderActions,
  ArdoSidebar,
  ArdoSidebarSection,
  ArdoGeneratedSidebar,
  ArdoSocialLink,
  type ArdoThemeProps,
} from "ardo/ui"
import "./theme.css"

import logo from "./assets/logo.svg"

export const meta: ArdoMetaFunction = () => [
  { title: "Ardo" },
  { name: "description", content: t`Documentation for React teams` },
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
  const locale = getI18n().locale
  const labels = translatedLabels()
  return (
    <ArdoRoot
      labels={labels}
      components={{ wrapper: LocalizedContent }}
      theme={theme}
      logo={logo}
      editLink={{
        pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
        text: t`Edit this page on GitHub`,
      }}
      lastUpdated={{
        enabled: true,
        text: labels.page.lastUpdated,
      }}
    >
      <ArdoHeader searchPlaceholder={t`Search documentation...`}>
        <ArdoHeaderActions>
          <ArdoSocialLink href="https://github.com/sebastian-software/ardo" icon="github" />
        </ArdoHeaderActions>
      </ArdoHeader>

      {/* Sections come from the top-level route folders: guide, api-reference. */}
      <ArdoSidebar>
        <ArdoSidebarSection
          id="guide"
          label={t`Guide`}
          to={`/${locale}/guide/getting-started`}
          match={`/${locale}/guide`}
        >
          <ArdoGeneratedSidebar section="guide" />
        </ArdoSidebarSection>
        <ArdoSidebarSection
          id="api-reference"
          label={t`API reference`}
          to={`/${locale}/api-reference`}
          match={`/${locale}/api-reference`}
        >
          <ArdoGeneratedSidebar section="api-reference" />
        </ArdoSidebarSection>
      </ArdoSidebar>

      <ArdoFooter
        sponsor={{ text: "Sebastian Software", link: "https://oss.sebastian-software.com" }}
        message={
          <>
            <Trans>
              Code under the MIT License. Icons by <a href="https://streamlinehq.com">Streamline</a>
              . Logos belong to their projects.
            </Trans>
          </>
        }
        copyright={
          <>
            {t`© 2026 Sebastian Software GmbH, Mainz, Germany`} ·{" "}
            <a href="https://sebastian-software.com/imprint">{t`Imprint`}</a> ·{" "}
            <a href="https://sebastian-software.com/privacy-policy">{t`Privacy`}</a>
          </>
        }
      />
    </ArdoRoot>
  )
}
