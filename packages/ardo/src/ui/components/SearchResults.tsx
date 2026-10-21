import { useEffect, useRef } from "react"
import { ArdoLink } from "../../runtime/page"

import type { ArdoLabels } from "../labels"

import { ArdoOwlMark } from "../OwlMark"
import { getSearchResultContext, type SearchMatch, shortenExcerpt } from "./search-result-text"
import * as styles from "./Search.css"

export type { SearchMatch } from "./search-result-text"

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
              <ArdoLink
                id={getOptionId(result.id, index)}
                to={result.path}
                role="option"
                aria-selected={index === selectedIndex}
                className={[styles.searchResult, index === selectedIndex && "selected"]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onClose}
              >
                <SearchResultText result={result} />
              </ArdoLink>
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
            <ArdoOwlMark size={36} className={styles.searchNoResultsOwl} />
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

function SearchResultText({ result }: { result: SearchMatch }) {
  const context = getSearchResultContext(result)
  return (
    <>
      <span className={styles.searchResultTitle}>{result.title}</span>
      {context !== undefined && <span className={styles.searchResultSection}>{context}</span>}
      {(result.excerpt ?? "") !== "" && (
        <span className={styles.searchResultExcerpt}>{shortenExcerpt(result.excerpt ?? "")}</span>
      )}
    </>
  )
}
