import { useEffect, useRef } from "react"
import { Link } from "react-router"

import type { ArdoLabels } from "../labels"

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
  labels,
  onClose,
}: {
  getOptionId: (resultId: string, index: number) => string
  listboxId: string
  results: SearchMatch[]
  selectedIndex: number
  query: string
  labels: ArdoLabels["search"]
  onClose: () => void
}) {
  const resultsRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const selectedOption = resultsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    selectedOption?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  return (
    <>
      <div className={styles.searchStatus} role="status" aria-live="polite" aria-atomic="true">
        {results.length > 0 ? labels.resultCount(results.length) : labels.noResults(query)}
      </div>
      {results.length > 0 ? (
        <ul
          ref={resultsRef}
          id={listboxId}
          className={styles.searchResults}
          role="listbox"
          aria-label={labels.results}
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
        <div>
          <ul
            id={listboxId}
            className={styles.searchResults}
            role="listbox"
            aria-label={labels.results}
          />
          <div className={styles.searchNoResults}>
            <ArdoOwlMark size={36} className={styles.searchNoResultsOwl} title="" />
            <span>{labels.noResults(query)}</span>
          </div>
        </div>
      )}
      <div className={styles.searchFooter}>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> {labels.navigate}
        </span>
        <span>
          <kbd>↵</kbd> {labels.select}
        </span>
        <span>
          <kbd>esc</kbd> {labels.close}
        </span>
      </div>
    </>
  )
}
