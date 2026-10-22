import { type AnchorHTMLAttributes, type ReactNode, use, useMemo } from "react"

import {
  type ArdoPage,
  ArdoPageContext,
  normalizeBase,
  normalizePath,
  useArdoHref,
  useIsActivePath,
} from "./page-context"

export type ArdoPageProviderProps = Partial<ArdoPage> & { children: ReactNode }

/**
 * Describe the page being rendered. Ardo's renderer provides it for every page;
 * tests and isolated previews use it to render components at a given path.
 */
export function ArdoPageProvider({
  children,
  base = "/",
  path = "/",
  component,
  error,
  handle,
  source,
}: ArdoPageProviderProps) {
  const value = useMemo(
    () => ({
      base: normalizeBase(base),
      component,
      error,
      handle,
      path: normalizePath(path),
      source,
    }),
    [base, component, error, handle, path, source]
  )
  return <ArdoPageContext value={value}>{children}</ArdoPageContext>
}

/** Render the current page's content, or its error component. */
export function ArdoOutlet() {
  const { component: Component } = use(ArdoPageContext)
  return Component == null ? null : <Component />
}

export type ArdoLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** Internal path such as `/guide/intro`, a relative path, an anchor, or an external URL. */
  to: string
  children?: ReactNode
}

/** Link to another page. Internal targets get the site's base path. */
export function ArdoLink({ to, children, ...props }: ArdoLinkProps) {
  const href = useArdoHref(to)
  return (
    <a {...props} href={href}>
      {children}
    </a>
  )
}

export type ArdoActiveLinkProps = Omit<ArdoLinkProps, "className"> & {
  /** Only match the exact path, not its descendants. */
  end?: boolean
  /** A string gets `active` appended when the link matches the current page. */
  className?: ((state: { isActive: boolean }) => string | undefined) | string
}

/**
 * Link that knows whether it points at the current page. It sets
 * `aria-current="page"` and, for a string class name, adds `active`.
 */
export function ArdoActiveLink({
  to,
  end = false,
  className,
  children,
  ...props
}: ArdoActiveLinkProps) {
  const isActive = useIsActivePath(to, end)
  const resolvedClassName =
    typeof className === "function"
      ? className({ isActive })
      : [className, isActive && "active"].filter(Boolean).join(" ") || undefined
  return (
    <ArdoLink
      {...props}
      to={to}
      className={resolvedClassName}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </ArdoLink>
  )
}
