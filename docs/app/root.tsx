import { t } from "@palamedes/core/macro"
import { Trans } from "@palamedes/react/macro"
import { getI18n } from "@palamedes/runtime"
import { LocalizedContent } from "./i18n/Content"
import { translatedLabels } from "./i18n/labels"
import "./i18n/runtime"

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
} from "ardo/ui"
import "./theme.css"

import logo from "./assets/logo.svg"

export const meta: ArdoMetaFunction = () => [
  { title: "Ardo" },
  { name: "description", content: t`Documentation for React teams` },
]

export const ErrorBoundary = ArdoErrorBoundary

export default function Root() {
  const locale = getI18n().locale
  const labels = translatedLabels()
  return (
    <ArdoRoot
      labels={labels}
      components={{ wrapper: LocalizedContent }}
      editLink={{
        pattern: "https://github.com/sebastian-software/ardo/edit/main/docs/app/routes/:path",
        text: t`Edit this page on GitHub`,
      }}
      lastUpdated={{
        enabled: true,
        text: labels.page.lastUpdated,
      }}
    >
      <ArdoHeader logo={logo} searchPlaceholder={t`Search documentation...`}>
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
