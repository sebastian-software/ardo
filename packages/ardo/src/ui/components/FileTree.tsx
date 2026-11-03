import { Children, isValidElement, type ReactElement, type ReactNode } from "react"

import { useArdoLabels } from "../../runtime/hooks"
import type { ArdoLabels } from "../labels"
import * as styles from "./FileTree.css"
import { ArdoIcon } from "./Icon"

/** Separates an entry's name from its muted comment, as in `root.tsx — the root layout`. */
const COMMENT_SEPARATOR = "—"

/** File names with these extensions get the code icon; other files get the text icon. */
const CODE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?|json|css|html?|ya?ml|toml|sh|py|go|rs)$/iu

export type ArdoFileTreeProps = {
  /**
   * A nested Markdown list. An item is a folder when it has a nested list or its name ends with
   * `/`. Bold text highlights an entry, and text after ` — ` renders as a muted comment.
   */
  children: ReactNode
  /** Additional CSS class. */
  className?: string
}

type InlinePiece = {
  text: string
  strong: boolean
}

type FileTreeEntry = {
  name: string
  highlighted: boolean
  comment: string
  folder: boolean
  children: FileTreeEntry[]
}

function isListElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return (
    isValidElement<{ children?: ReactNode }>(node) && (node.type === "ul" || node.type === "ol")
  )
}

function isListItemElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement<{ children?: ReactNode }>(node) && node.type === "li"
}

/** Flattens inline content to text pieces, remembering which pieces are bold. */
function readInline(node: ReactNode, strong = false): InlinePiece[] {
  return Children.toArray(node).flatMap((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return [{ text: String(child), strong }]
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      const isStrong = strong || child.type === "strong" || child.type === "b"
      return readInline(child.props.children, isStrong)
    }
    return []
  })
}

/** Splits an item's label at the comment separator and reports whether its name is bold. */
function readLabel(pieces: InlinePiece[]): Pick<FileTreeEntry, "comment" | "highlighted" | "name"> {
  const text = pieces.map((piece) => piece.text).join("")
  const separatorIndex = text.indexOf(COMMENT_SEPARATOR)
  const nameEnd = separatorIndex === -1 ? text.length : separatorIndex

  let name = ""
  let highlighted = false
  let offset = 0
  for (const piece of pieces) {
    const visible = piece.text.slice(0, Math.max(0, nameEnd - offset))
    name += visible
    if (piece.strong && visible.trim() !== "") highlighted = true
    offset += piece.text.length
  }

  return {
    name: name.trim(),
    highlighted,
    comment: separatorIndex === -1 ? "" : text.slice(separatorIndex + 1).trim(),
  }
}

function readItem(item: ReactElement<{ children?: ReactNode }>): FileTreeEntry | null {
  const pieces: InlinePiece[] = []
  const children: FileTreeEntry[] = []

  for (const node of Children.toArray(item.props.children)) {
    if (isListElement(node)) {
      children.push(...readList(node))
    } else {
      pieces.push(...readInline(node))
    }
  }

  const label = readLabel(pieces)
  if (label.name === "" && children.length === 0) return null

  return {
    ...label,
    folder: children.length > 0 || label.name.endsWith("/"),
    children,
  }
}

/** Reads every item of the lists in `nodes`, skipping anything that is not a list. */
function readList(nodes: ReactNode): FileTreeEntry[] {
  return Children.toArray(nodes).flatMap((node) => {
    if (!isListElement(node)) return []
    return Children.toArray(node.props.children).flatMap((item) => {
      if (!isListItemElement(item)) return []
      const entry = readItem(item)
      return entry == null ? [] : [entry]
    })
  })
}

function FileTreeList({
  entries,
  labels,
  nested = false,
}: {
  entries: FileTreeEntry[]
  labels: ArdoLabels["fileTree"]
  nested?: boolean
}) {
  return (
    <ul
      className={nested ? `${styles.list} ${styles.group}` : styles.list}
      aria-label={nested ? undefined : labels.label}
    >
      {entries.map((entry, index) => {
        const iconName = entry.folder
          ? "Folder"
          : CODE_FILE_PATTERN.test(entry.name)
            ? "FileCode"
            : "FileText"
        const rowClassName = entry.highlighted ? `${styles.row} ${styles.highlighted}` : styles.row

        return (
          <li key={`${String(index)}-${entry.name}`} className={styles.item}>
            <div className={rowClassName}>
              <ArdoIcon
                name={iconName}
                size={16}
                role="img"
                aria-label={entry.folder ? labels.folder : labels.file}
                className={entry.folder ? `${styles.icon} ${styles.folderIcon}` : styles.icon}
              />
              <span className={styles.name}>{entry.name}</span>
              {entry.comment !== "" && <span className={styles.comment}>{entry.comment}</span>}
            </div>
            {entry.children.length > 0 && (
              <FileTreeList entries={entry.children} labels={labels} nested />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Static directory tree for documentation, written as a nested Markdown list.
 *
 * Renders as a list with an accessible name, so it needs no client state. Folders and files
 * get icons, and nested folders are connected by indentation guides.
 *
 * @example
 * ```mdx
 * <FileTree>
 *
 * - app/
 *   - routes/
 *     - index.mdx
 *   - **root.tsx** — the root layout
 * - package.json
 *
 * </FileTree>
 * ```
 */
export function ArdoFileTree({ children, className }: ArdoFileTreeProps) {
  const labels = useArdoLabels().fileTree
  const entries = readList(children)
  if (entries.length === 0) {
    if (import.meta.env?.DEV && Children.count(children) > 0) {
      console.warn(
        "[Ardo] FileTree expects a nested Markdown list. In MDX, put a blank line between the tags and the list."
      )
    }
    return null
  }

  const rootClassName = className == null ? styles.fileTree : `${styles.fileTree} ${className}`
  return (
    <div className={rootClassName}>
      <FileTreeList entries={entries} labels={labels} />
    </div>
  )
}
