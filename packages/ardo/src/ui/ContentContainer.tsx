import type { ComponentPropsWithoutRef } from "react"

import * as styles from "./ContentContainer.css"

export type ArdoContentContainerProps = ComponentPropsWithoutRef<"div"> & {
  /** Align custom content to the page width (default) or the reading measure. */
  width?: "page" | "reading"
}

/** A bounded content column inside a full-width section or bare page. */
export function ArdoContentContainer({
  width = "page",
  className,
  ...props
}: ArdoContentContainerProps) {
  return (
    <div
      {...props}
      className={["ardo-content-container", styles.container, className].filter(Boolean).join(" ")}
      data-width={width}
    />
  )
}
