import {
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
  Children,
  isValidElement,
  cloneElement,
} from "react"

export interface FileTreeProps {
  /** Content to display — expects an unordered list (`<ul>`) from MDX */
  children: ReactNode
}

/**
 * Extracts text content from nested React nodes.
 */
function getTextContent(node: ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!isValidElement(node)) return ""
  const children = (node.props as { children?: ReactNode }).children
  if (!children) return ""
  return Children.toArray(children).map(getTextContent).join("")
}

/**
 * Checks whether a list item represents a directory (text ends with `/`).
 */
function isDirectory(node: ReactElement): boolean {
  const children = (node.props as { children?: ReactNode }).children
  const childArray = Children.toArray(children)

  // If the item has a nested <ul>, it's a directory
  for (const child of childArray) {
    if (isValidElement(child) && (child.type === "ul" || child.type === "ol")) {
      return true
    }
  }

  // If text content ends with `/`, it's a directory
  const text = getTextContent(node).trim()
  return text.endsWith("/")
}

/**
 * Recursively processes `<ul>` / `<li>` children, applying CSS classes
 * for directory vs. file styling.
 */
function processChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child

    const props = child.props as { children?: ReactNode; className?: string }

    const el = child as ReactElement<HTMLAttributes<HTMLElement>>

    if (child.type === "li") {
      const isDir = isDirectory(child)
      const className = [props.className, isDir ? "ardo-filetree-dir" : "ardo-filetree-file"]
        .filter(Boolean)
        .join(" ")

      return cloneElement(el, { className }, processChildren(props.children))
    }

    if (child.type === "ul" || child.type === "ol") {
      return cloneElement(el, {}, processChildren(props.children))
    }

    return child
  })
}

/**
 * A wrapper for unordered lists that renders a file/folder tree with icons.
 *
 * @example
 * ```mdx
 * <FileTree>
 * - src/
 *   - components/
 *     - Header.tsx
 *     - Footer.tsx
 *   - index.ts
 * - package.json
 * - README.md
 * </FileTree>
 * ```
 */
export function FileTree({ children }: FileTreeProps) {
  return <div className="ardo-filetree">{processChildren(children)}</div>
}
