import { useCallback, useEffect, useId, useRef, useState } from "react"
import { navigateTo, useArdoHrefResolver } from "../../runtime/page-context"

import type { ArdoLabels } from "../labels"

import { useArdoLabels } from "../../runtime/hooks"
import { ChromeIcon } from "../chrome-icons"
import {
  getActiveSearchOptionId,
  getSearchKeyboardAction,
  getSearchOptionId,
  getSearchShortcutModifier,
} from "./search-a11y"
import { useGlobalSearchShortcut, useOutsideClick } from "./search-hooks"
import { loadSearchIndex } from "./search-index"
import { consumeSearchRecoveryQuery, reloadSearch } from "./search-recovery"
import * as styles from "./Search.css"
import { SearchPopover } from "./SearchPopover"
import { type SearchMatch, SearchResults } from "./SearchResults"

export type ArdoSearchProps = {
  /** Placeholder text for the search input (default: "Search...") */
  placeholder?: string
  /** Focus the input on mount (used by the mobile search overlay). */
  autoFocus?: boolean
  /**
   * Focus this input on ⌘K / Ctrl+K (default: true). The header search turns
   * this off and handles the shortcut itself.
   */
  shortcut?: boolean
}

function normalizeResults(rawResults: Array<Record<string, unknown>>): SearchMatch[] {
  return rawResults.flatMap((result): SearchMatch[] => {
    const resultPath = typeof result.path === "string" ? result.path : undefined
    const title = typeof result.title === "string" ? result.title : undefined
    if (resultPath === undefined || title === undefined) return []
    return [
      {
        id: String(result.id),
        title,
        path: resultPath,
        pageTitle: typeof result.pageTitle === "string" ? result.pageTitle : undefined,
        excerpt: typeof result.excerpt === "string" ? result.excerpt : undefined,
        section: typeof result.section === "string" ? result.section : undefined,
      },
    ]
  })
}

function useSearch() {
  const latestRequest = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchMatch[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("ready")

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    const request = ++latestRequest.current
    setResults([])
    setSelectedIndex(0)
    if (!searchQuery.trim()) {
      setIsOpen(false)
      setStatus("ready")
      return
    }
    setStatus("loading")
    setIsOpen(true)
    void loadSearchIndex()
      .then((index) => {
        if (latestRequest.current !== request) return
        setResults(normalizeResults(index.search(searchQuery).slice(0, 10)))
        setStatus("ready")
      })
      .catch(() => {
        if (latestRequest.current === request) setStatus("error")
      })
  }, [])

  return { isOpen, setIsOpen, query, results, selectedIndex, setSelectedIndex, search, status }
}

function SearchInput({
  inputRef,
  setInputRef,
  placeholder,
  query,
  hasQuery,
  onSearch,
  onKeyDown,
  onFocus,
  activeOptionId,
  expanded,
  listboxId,
  labels,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  setInputRef: React.RefCallback<HTMLInputElement>
  placeholder: string
  query: string
  hasQuery: boolean
  onSearch: (q: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
  activeOptionId?: string
  expanded: boolean
  listboxId: string
  labels: ArdoLabels["search"]
}) {
  return (
    <div className={styles.searchField}>
      <ChromeIcon name="search" />
      <input
        ref={setInputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          onSearch(e.target.value)
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        aria-label={labels.label}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
      />
      {hasQuery && (
        <button
          type="button"
          className={styles.searchClear}
          onClick={(e) => {
            e.stopPropagation()
            onSearch("")
            inputRef.current?.focus()
          }}
          aria-label={labels.clear}
        >
          <ChromeIcon name="close" />
        </button>
      )}
      <span className={styles.searchKbd}>
        <kbd suppressHydrationWarning>{getSearchShortcutModifier()}</kbd>
        <kbd>K</kbd>
      </span>
    </div>
  )
}

function useSearchA11y({
  expanded,
  results,
  selectedIndex,
}: {
  expanded: boolean
  results: SearchMatch[]
  selectedIndex: number
}) {
  const searchId = useId()
  const listboxId = `${searchId}-results`
  const getOptionId = (resultId: string, index: number) =>
    getSearchOptionId(listboxId, resultId, index)
  const activeOptionId = getActiveSearchOptionId({
    getOptionId,
    isOpen: expanded,
    results,
    selectedIndex,
  })

  return { activeOptionId, getOptionId, listboxId }
}

function useSearchInputRef(autoFocus: boolean) {
  const inputRef = useRef<HTMLInputElement>(null)
  const setInputRef = useCallback(
    (input: HTMLInputElement | null) => {
      inputRef.current = input
      if (input != null && autoFocus) input.focus()
    },
    [autoFocus]
  )
  return { inputRef, setInputRef }
}

function useSearchRecovery(
  inputRef: React.RefObject<HTMLInputElement | null>,
  search: (query: string) => void
) {
  useEffect(() => {
    const input = inputRef.current
    if (input == null || input.getClientRects().length === 0) return
    const query = consumeSearchRecoveryQuery()
    if (query == null) return
    search(query)
    input.focus()
  }, [inputRef, search])
}

export function ArdoSearch({ placeholder, autoFocus = false, shortcut = true }: ArdoSearchProps) {
  const resolveHref = useArdoHrefResolver()
  const labels = useArdoLabels()
  const containerRef = useRef<HTMLDivElement>(null)
  const { inputRef, setInputRef } = useSearchInputRef(autoFocus)
  const state = useSearch()
  useSearchRecovery(inputRef, state.search)
  const hasQuery = state.query.trim().length > 0
  const expanded = state.isOpen && hasQuery
  const searchA11y = useSearchA11y({
    expanded,
    results: state.results,
    selectedIndex: state.selectedIndex,
  })

  useGlobalSearchShortcut(inputRef, state.setIsOpen, shortcut)
  useOutsideClick({
    containerRef,
    popoverClass: styles.searchPopover,
    isOpen: state.isOpen,
    setIsOpen: state.setIsOpen,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const action = getSearchKeyboardAction({
      key: e.key,
      results: state.results,
      selectedIndex: state.selectedIndex,
    })

    switch (action.type) {
      case "select-index":
        if (state.isOpen) {
          e.preventDefault()
          state.setSelectedIndex(action.index)
        }
        break
      case "navigate":
        e.preventDefault()
        navigateTo(resolveHref(action.path))
        state.setIsOpen(false)
        break
      case "close":
        state.setIsOpen(false)
        inputRef.current?.blur()
        break
      case "none":
        break
    }
  }

  return (
    <div
      className={styles.search}
      ref={containerRef}
      data-expanded={expanded ? "true" : "false"}
      onMouseDown={() => inputRef.current?.focus()}
    >
      <SearchInput
        inputRef={inputRef}
        setInputRef={setInputRef}
        placeholder={placeholder ?? labels.search.placeholder}
        query={state.query}
        hasQuery={hasQuery}
        onSearch={state.search}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Start loading the index while the reader types the first letters.
          void loadSearchIndex().catch(() => {
            // A query shows the error and a retry action; prefetch stays quiet.
          })
          if (hasQuery) state.setIsOpen(true)
        }}
        activeOptionId={searchA11y.activeOptionId}
        expanded={expanded}
        listboxId={searchA11y.listboxId}
        labels={labels.search}
      />
      {expanded && (
        <SearchPopover anchorRef={containerRef}>
          <SearchResults
            getOptionId={searchA11y.getOptionId}
            listboxId={searchA11y.listboxId}
            results={state.results}
            selectedIndex={state.selectedIndex}
            query={state.query}
            labels={labels.search}
            status={state.status}
            onRetry={() => reloadSearch(state.query)}
            onClose={() => {
              state.setIsOpen(false)
            }}
          />
        </SearchPopover>
      )}
    </div>
  )
}
