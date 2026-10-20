import { Children, isValidElement, type ReactNode } from "react"

/** Read prose or intrinsic highlighted content without invoking components. */
export function getNodeText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return getNodeText(child.props.children)
      }
      return ""
    })
    .join("")
}
