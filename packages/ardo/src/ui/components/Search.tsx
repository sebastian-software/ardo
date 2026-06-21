import MiniSearch from "minisearch"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import searchDocs from "virtual:ardo/search-index"

import { SearchIcon } from "../icons"
import { getActiveSearchOptionId, getSearchKeyboardAction, getSearchOptionId } from "./search-a11y"
import { useGlobalSearchShortcut, useOutsideClick } from "./search-hooks"
import * as styles from "./Search.css"
import { SearchPopover } from "./SearchPopover"
import { type SearchMatch, SearchResults } from "./SearchResults"

type SearchDoc = {
  id: string
  title: string
  content: string
  path: string
  section?: string
}

export type ArdoSearchProps = {
  /** Placeholder text for the search input (default: "Search...") */
  placeholder?: string
  /** Focus the input on mount (used by the mobile search overlay). */
  autoFocus?: boolean
}

function useSearchIndex() {
  return useMemo(() => {
    const index = new MiniSearch<SearchDoc>({
      fields: ["title", "content", "section"],
      storeFields: ["title", "path", "section"],
      searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
    })
    index.addAll(searchDocs)
    return index
  }, [])
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
        section: typeof result.section === "string" ? result.section : undefined,
      },
    ]
  })
}

function useSearch(searchIndex: ReturnType<typeof useSearchIndex>) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchMatch[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const search = (searchQuery: string) => {
    setQuery(searchQuery)
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      setSelectedIndex(0)
      return
    }
    const rawResults = searchIndex.search(searchQuery).slice(0, 10)
    setResults(normalizeResults(rawResults))
    setSelectedIndex(0)
    setIsOpen(true)
  }

  return { isOpen, setIsOpen, query, results, selectedIndex, setSelectedIndex, search }
}

function SearchInput({
  inputRef,
  placeholder,
  query,
  hasQuery,
  onSearch,
  onKeyDown,
  onFocus,
  activeOptionId,
  expanded,
  listboxId,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  placeholder: string
  query: string
  hasQuery: boolean
  onSearch: (q: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
  activeOptionId?: string
  expanded: boolean
  listboxId: string
}) {
  return (
    <div className={styles.searchField}>
      <SearchIcon size={18} />
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          onSearch(e.target.value)
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        aria-label="Search"
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
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      <span className={styles.searchKbd}>
        <kbd>⌘</kbd>
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

export function ArdoSearch({ placeholder = "Search...", autoFocus = false }: ArdoSearchProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchIndex = useSearchIndex()
  const state = useSearch(searchIndex)
  const hasQuery = state.query.trim().length > 0
  const expanded = state.isOpen && hasQuery
  const searchA11y = useSearchA11y({
    expanded,
    results: state.results,
    selectedIndex: state.selectedIndex,
  })

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useGlobalSearchShortcut(inputRef, state.setIsOpen)
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
        void navigate(action.path)
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
        placeholder={placeholder}
        query={state.query}
        hasQuery={hasQuery}
        onSearch={state.search}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (hasQuery) state.setIsOpen(true)
        }}
        activeOptionId={searchA11y.activeOptionId}
        expanded={expanded}
        listboxId={searchA11y.listboxId}
      />
      {expanded && (
        <SearchPopover anchorRef={containerRef}>
          <SearchResults
            getOptionId={searchA11y.getOptionId}
            listboxId={searchA11y.listboxId}
            results={state.results}
            selectedIndex={state.selectedIndex}
            query={state.query}
            onClose={() => {
              state.setIsOpen(false)
            }}
          />
        </SearchPopover>
      )}
    </div>
  )
}
