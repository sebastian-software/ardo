import { type ChangeEvent, use } from "react"
import { useArdoHrefResolver, useArdoPath } from "../runtime/page-context"

import { useArdoLabels } from "../runtime/hooks"
import { ChromeIcon } from "./chrome-icons"
import { joinClassNames } from "./classnames"
import * as headerStyles from "./Header.css"
import * as styles from "./site-controls.css"
import {
  ArdoMobilePanelContext,
  useHasVersionSwitcher,
  useLocaleChoice,
  useVersionChoice,
  versionLabel,
} from "./site-controls-state"
import { getLocalizedPath, getVersionHref } from "./version-path"

export type ArdoVersionSwitcherProps = {
  /** Additional CSS classes for the control. */
  className?: string
}

export type ArdoVersionControlProps = ArdoVersionSwitcherProps & {
  /** Separate the control from the content above with a rule. */
  divided?: boolean
}

/**
 * Documentation version select. It keeps the reader on the same page in the
 * target version and renders nothing unless two or more versions exist.
 */
export function ArdoVersionSwitcher({ className }: ArdoVersionSwitcherProps) {
  const choice = useVersionChoice()
  const pathname = useArdoPath()
  const labels = useArdoLabels()
  if (choice == null) return null
  const { current, versions } = choice

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const target = versions.find((version) => version.id === event.target.value)
    if (target == null || target.id === current.id) return
    globalThis.location.assign(
      `${getVersionHref(pathname, target.path)}${globalThis.location.search}${globalThis.location.hash}`
    )
  }

  return (
    <span className={joinClassNames(headerStyles.selectControl, className)}>
      <select
        aria-label={labels.siteControls.version}
        className={headerStyles.versionSwitcher}
        onChange={handleChange}
        title={labels.siteControls.version}
        value={current.id}
      >
        {versions.map((version) => (
          <option key={version.id} value={version.id}>
            {versionLabel(version)}
          </option>
        ))}
      </select>
      <ChromeIcon name="chevron" className={headerStyles.selectChevron} />
    </span>
  )
}

/** Documentation language select. Renders nothing unless two or more locales exist. */
export function ArdoLocaleSwitcher() {
  const choice = useLocaleChoice()
  const pathname = useArdoPath()
  const resolveHref = useArdoHrefResolver()
  const labels = useArdoLabels()
  if (choice == null) return null
  const { current, locales } = choice

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const target = event.target.value
    if (target === current) return
    globalThis.location.assign(
      `${resolveHref(getLocalizedPath(pathname, current, target))}${globalThis.location.search}${globalThis.location.hash}`
    )
  }

  return (
    <span className={headerStyles.selectControl}>
      <ChromeIcon name="language" className={headerStyles.selectLeading} />
      <select
        aria-label={labels.siteControls.language}
        className={joinClassNames(headerStyles.versionSwitcher, headerStyles.localeSwitcher)}
        onChange={handleChange}
        title={labels.siteControls.language}
        value={current}
      >
        {locales.map((locale) => (
          <option key={locale.id} value={locale.id}>
            {locale.label ?? locale.id}
          </option>
        ))}
      </select>
      <ChromeIcon name="chevron" className={headerStyles.selectChevron} />
    </span>
  )
}

/**
 * Version switcher with a visible label, for the end of the sidebar and the
 * footer of bare pages. The mobile menu shows its own, so it renders nothing
 * there.
 */
export function ArdoVersionControl({ className, divided = false }: ArdoVersionControlProps) {
  const inMobilePanel = use(ArdoMobilePanelContext)
  const hasVersions = useHasVersionSwitcher()
  const labels = useArdoLabels()
  if (inMobilePanel || !hasVersions) return null
  return (
    <div
      className={joinClassNames(
        "ardo-version-control",
        styles.versionControl,
        divided ? styles.versionControlDivided : undefined,
        className
      )}
    >
      <span className={styles.controlLabel}>{labels.siteControls.version}</span>
      <ArdoVersionSwitcher />
    </div>
  )
}

/**
 * Notice on any documentation version other than the latest, with a link to
 * the same page there. The latest version is the first entry of
 * `versioning.versions`.
 */
export function ArdoVersionBanner() {
  const choice = useVersionChoice()
  const pathname = useArdoPath()
  const labels = useArdoLabels()
  if (choice == null || choice.current.id === choice.latest.id) return null
  return (
    <div className={joinClassNames("ardo-version-banner", styles.versionBanner)} role="note">
      <span>{labels.siteControls.olderVersion(versionLabel(choice.current))}</span>{" "}
      <a className={styles.versionBannerLink} href={getVersionHref(pathname, choice.latest.path)}>
        {labels.siteControls.latestVersion(versionLabel(choice.latest))}
      </a>
    </div>
  )
}
