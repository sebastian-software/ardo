import { useEffect, useRef } from "react"
import { Link } from "react-router"

import { ArdoOwlMark } from "../OwlMark"
import * as styles from "./Search.css"

export type SearchMatch = {
  id: string
  title: string
  path: string
  section?: string
}

export function SearchResults({
  getOptionId,
  listboxId,
  results,
  selectedIndex,
  query,
  onClose,
}: {
  getOptionId: (resultId: string, index: number) => string
  listboxId: string
  results: SearchMatch[]
  selectedIndex: number
  query: string
  onClose: () => void
}) {
  const resultsRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const selectedOption = resultsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    selectedOption?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  return (
    <>
      {results.length > 0 ? (
        <ul
          ref={resultsRef}
          id={listboxId}
          className={styles.searchResults}
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result, index) => (
            <li key={result.id} role="presentation">
              <Link
                id={getOptionId(result.id, index)}
                to={result.path}
                role="option"
                aria-selected={index === selectedIndex}
                className={[styles.searchResult, index === selectedIndex && "selected"]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onClose}
              >
                <span className={styles.searchResultTitle}>{result.title}</span>
                {result.section !== undefined && (
                  <span className={styles.searchResultSection}>{result.section}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div id={listboxId} role="listbox" aria-label="Search results">
          <div className={styles.searchNoResults} role="status" aria-live="polite">
            <ArdoOwlMark size={36} className={styles.searchNoResultsOwl} title="" />
            <span>No results found for &quot;{query}&quot;</span>
          </div>
        </div>
      )}
      <div className={styles.searchFooter}>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>↵</kbd> to select
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </>
  )
}
