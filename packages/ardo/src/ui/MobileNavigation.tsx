import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react"

import { useArdoConfig, useArdoLabels } from "../runtime/hooks"
import { useArdoPath } from "../runtime/page-context"
import { ChromeIcon } from "./chrome-icons"
import { joinClassNames } from "./classnames"
import * as styles from "./Header.css"
import type { ArdoLogo } from "./HeaderLogo"
import { MobileSlidePanel } from "./MobileSlidePanel"

export type ArdoMobileNavigationProps = {
  /** Sidebar or other navigation shown inside the mobile dialog. */
  children: ReactNode
  title?: string
  logo?: ArdoLogo
  nav?: ReactNode
  actions?: ReactNode
  themeToggle?: boolean
  /** Controlled state, for example to close navigation before opening search. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Accessible name of the trigger; defaults to the configured menu label. */
  label?: string
  /** Trigger content; defaults to the menu icon. */
  trigger?: ReactNode
  /** Additional trigger classes. The trigger follows Ardo's mobile breakpoint. */
  className?: string
}

/** The standard mobile navigation behavior for a site-owned header. */
export function ArdoMobileNavigation({
  children,
  title,
  logo,
  nav,
  actions,
  themeToggle = false,
  open: controlledOpen,
  onOpenChange,
  label,
  trigger,
  className,
}: ArdoMobileNavigationProps) {
  const config = useArdoConfig()
  const labels = useArdoLabels()
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [localOpen, setLocalOpen] = useState(false)
  const open = controlledOpen ?? localOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setLocalOpen(next)
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange]
  )
  const close = useCallback(() => setOpen(false), [setOpen])
  const path = useArdoPath()
  const previousPath = useRef(path)
  useEffect(() => {
    if (path === previousPath.current) return
    previousPath.current = path
    close()
  }, [path, close])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={joinClassNames(styles.mobileMenuButton, className)}
        aria-label={label ?? labels.header.toggleMenu}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        {trigger ?? <ChromeIcon name="menu" />}
      </button>
      {open && (
        <MobileSlidePanel
          id={id}
          title={title ?? config.title}
          logo={logo ?? config.brand?.logo}
          nav={nav}
          actions={actions}
          themeToggle={themeToggle}
          triggerRef={triggerRef}
          onClose={close}
        >
          {children}
        </MobileSlidePanel>
      )}
    </>
  )
}
