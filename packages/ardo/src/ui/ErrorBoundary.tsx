import { ArdoLink } from "../runtime/page"
import { type ArdoPageError, useArdoPage } from "../runtime/page-context"

import * as styles from "./ErrorBoundary.css"
import { ArdoOwlMark } from "./OwlMark"

export type ArdoErrorBoundaryProps = {
  /** Override the heading/description shown for 404 responses. */
  notFound?: {
    title?: string
    description?: string
    homeLabel?: string
    homeHref?: string
  }
  /** Override the heading/description shown for non-404 errors. */
  error?: {
    title?: string
    description?: string
    homeLabel?: string
    homeHref?: string
  }
}

const defaults = {
  notFound: {
    title: "This page wandered off",
    description:
      "The page you were looking for has moved, been renamed, or never existed. The owl is on the case.",
    homeLabel: "Back to home",
    homeHref: "/",
  },
  error: {
    title: "Something went wrong",
    description:
      "An unexpected error happened while loading this page. Try again, or head back to safer ground.",
    homeLabel: "Back to home",
    homeHref: "/",
  },
} as const

/**
 * Themed error/404 page. Ardo renders it for missing pages and render errors;
 * export a different `ErrorBoundary` from `app/root.tsx` to replace it.
 *
 * @example
 * ```tsx
 * // app/root.tsx
 * export { ArdoErrorBoundary as ErrorBoundary } from "ardo/ui"
 * ```
 */
export function ArdoErrorBoundary(props: ArdoErrorBoundaryProps = {}) {
  const { error } = useArdoPage()
  const status = isStatusError(error) ? error.status : undefined
  const is404 = status === 404

  const copy = is404
    ? { ...defaults.notFound, ...props.notFound }
    : { ...defaults.error, ...props.error }

  const statusLabel = status == null ? "Error" : `Error ${String(status)}`
  const errorDetails = is404 ? undefined : formatErrorDetails(error)

  return (
    <main className={styles.root}>
      <section className={styles.card}>
        <ArdoOwlMark size={120} className={styles.owl} />
        <p className={styles.status}>{statusLabel}</p>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.actions}>
          <ArdoLink to={copy.homeHref} className={styles.primaryAction}>
            {copy.homeLabel}
          </ArdoLink>
          {!is404 && (
            <button
              type="button"
              onClick={() => {
                globalThis.location.reload()
              }}
              className={styles.secondaryAction}
            >
              Reload
            </button>
          )}
        </div>
        {errorDetails != null && (
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>Technical details</summary>
            <pre className={styles.detailsPre}>{errorDetails}</pre>
          </details>
        )}
      </section>
    </main>
  )
}

function isStatusError(error: ArdoPageError | undefined): error is { status: number } {
  return error != null && !(error instanceof Error)
}

function formatErrorDetails(error: ArdoPageError | undefined): string | undefined {
  if (isStatusError(error)) {
    return error.message != null && error.message.length > 0 ? error.message : undefined
  }
  if (error instanceof Error) {
    return error.stack ?? error.message
  }
  return undefined
}
