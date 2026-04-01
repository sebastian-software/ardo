import MiniSearch from "minisearch"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router"
import searchDocs from "virtual:ardo/search-index"

import { SearchIcon } from "../icons"
import * as styles from "./Search.css"

interface SearchDoc {
  id: string
  title: string
  content: string
  path: string
  section?: string
}

interface SearchMatch {
  id: string
  title: string
  path: string
  section?: string
}

export interface ArdoSearchProps {
  /** Placeholder text for the search input (default: "Search...") */
  placeholder?: string
}

function useGlobalSearchShortcut(
  inputRef: React.RefObject<HTMLInputElement | null>,
  setIsOpen: (open: boolean) => void
) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [inputRef, setIsOpen])
}

function useOutsideClick(
  containerRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void
) {
  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("touchstart", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("touchstart", handleOutsideClick)
    }
  }, [containerRef, isOpen, setIsOpen])
}

function useSearchIndex() {
  return useMemo(() => {
    const index = new MiniSearch<SearchDoc>({
      fields: ["title", "content", "section"],
      storeFields: ["title", "path", "section"],
      searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
    })
    index.addAll(searchDocs as SearchDoc[])
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

function SearchResults({
  results,
  selectedIndex,
  query,
  onClose,
}: {
  results: SearchMatch[]
  selectedIndex: number
  query: string
  onClose: () => void
}) {
  return (
    <>
      {results.length > 0 ? (
        <ul className={styles.searchResults}>
          {results.map((result, index) => (
            <li key={result.id}>
              <Link
                to={result.path}
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
        <div className={styles.searchNoResults}>No results found for &quot;{query}&quot;</div>
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
    setResults(normalizeResults(rawResults as Array<Record<string, unknown>>))
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
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  placeholder: string
  query: string
  hasQuery: boolean
  onSearch: (q: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
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

function PopoverPortal({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 400),
    })
  }, [anchorRef])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className={styles.searchPopover}
      style={{
        top: pos.top,
        left: pos.left,
        width: Math.min(pos.width, globalThis.innerWidth - 32),
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export function ArdoSearch({ placeholder = "Search..." }: ArdoSearchProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchIndex = useSearchIndex()
  const state = useSearch(searchIndex)
  const hasQuery = state.query.trim().length > 0

  useGlobalSearchShortcut(inputRef, state.setIsOpen)
  useOutsideClick(containerRef, state.isOpen, state.setIsOpen)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        if (state.results.length > 0) {
          e.preventDefault()
          state.setSelectedIndex((p) => Math.min(p + 1, state.results.length - 1))
        }
        break
      case "ArrowUp":
        if (state.results.length > 0) {
          e.preventDefault()
          state.setSelectedIndex((p) => Math.max(p - 1, 0))
        }
        break
      case "Enter": {
        const p = state.results[state.selectedIndex]?.path
        if (typeof p === "string") {
          e.preventDefault()
          void navigate(p)
          state.setIsOpen(false)
        }
        break
      }
      case "Escape":
        state.setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div
      className={styles.search}
      ref={containerRef}
      data-expanded={state.isOpen || hasQuery ? "true" : "false"}
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
      />
      {state.isOpen && hasQuery && (
        <PopoverPortal anchorRef={containerRef}>
          <SearchResults
            results={state.results}
            selectedIndex={state.selectedIndex}
            query={state.query}
            onClose={() => {
              state.setIsOpen(false)
            }}
          />
        </PopoverPortal>
      )}
    </div>
  )
}
