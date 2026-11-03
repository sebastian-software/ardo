import { type ReactNode, useState, useSyncExternalStore } from "react"

import type { PageBannerConfig, PageBannerVariant } from "../../config/types"
import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import * as styles from "./Banner.css"

export type ArdoBannerVariant = PageBannerVariant

export type ArdoBannerProps = {
  /** Color of the banner, matching the callout of the same name. Defaults to `"info"`. */
  variant?: ArdoBannerVariant
  /** Banner content, such as a sentence with a link. */
  children: ReactNode
  /** Additional CSS class. */
  className?: string
}

const icons: Record<ArdoBannerVariant, ReactNode> = {
  tip: <ChromeIcon name="tip" size={16} />,
  warning: <ChromeIcon name="warning" size={16} />,
  danger: <ChromeIcon name="danger" size={16} />,
  info: <ChromeIcon name="info" size={16} />,
  note: <ChromeIcon name="note" size={16} />,
}

/** Storage key prefix for dismissed page banners. The banner `id` completes the key. */
const DISMISSED_KEY_PREFIX = "ardo-banner-dismissed:"

function readDismissed(id: string): boolean {
  try {
    return globalThis.localStorage.getItem(DISMISSED_KEY_PREFIX + id) === "1"
  } catch {
    // Storage can be blocked or unavailable, so the banner stays visible.
    return false
  }
}

function writeDismissed(id: string): void {
  try {
    globalThis.localStorage.setItem(DISMISSED_KEY_PREFIX + id, "1")
  } catch {
    // The banner still hides for this view. It returns on the next visit.
  }
}

// The stores below never change while the page is open, so nothing subscribes to them.
function subscribeNever(): () => void {
  return () => {
    // Nothing changes while the page is open, so there is nothing to unsubscribe from.
  }
}

function BannerFrame({
  variant,
  className,
  action,
  children,
}: {
  variant: ArdoBannerVariant
  className?: string
  action?: ReactNode
  children: ReactNode
}) {
  const classes = [styles.banner({ variant }), className].filter(Boolean).join(" ")
  return (
    <div role="note" className={classes}>
      <span className={styles.bannerIcon({ variant })}>{icons[variant]}</span>
      <div className={styles.bannerBody}>{children}</div>
      {action}
    </div>
  )
}

/**
 * A notice at the top of a page, such as a release or a maintenance window. Use it in MDX for
 * formatted content and links. The banner is static and needs no JavaScript.
 *
 * @example
 * ```mdx
 * <Banner variant="warning">Version 7 is in beta. Report issues on GitHub.</Banner>
 * ```
 */
export function ArdoBanner({ variant = "info", className, children }: ArdoBannerProps) {
  return (
    <BannerFrame variant={variant} className={className}>
      {children}
    </BannerFrame>
  )
}

/**
 * Renders the `banner` frontmatter field above the page content. A dismissible banner gets a
 * close button once the page has loaded, and stays hidden in this browser after it is closed.
 * Server rendering and the first client render show the banner, so a dismissed banner can
 * disappear as soon as hydration finishes.
 */
export function ArdoPageBanner({ banner }: { banner: PageBannerConfig }) {
  const labels = useArdoLabels()
  const dismissId = banner.dismissible === true ? banner.id : undefined
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  )
  const storedDismissed = useSyncExternalStore(
    subscribeNever,
    () => dismissId != null && readDismissed(dismissId),
    () => false
  )
  const [dismissedHere, setDismissedHere] = useState(false)

  if (storedDismissed || dismissedHere) return null

  const action =
    hydrated && dismissId != null ? (
      <button
        type="button"
        className={styles.dismiss}
        aria-label={labels.banner.dismiss}
        onClick={() => {
          writeDismissed(dismissId)
          setDismissedHere(true)
        }}
      >
        <ChromeIcon name="close" size={14} />
      </button>
    ) : undefined

  return (
    <BannerFrame variant={banner.variant ?? "info"} action={action}>
      {banner.content}
    </BannerFrame>
  )
}
