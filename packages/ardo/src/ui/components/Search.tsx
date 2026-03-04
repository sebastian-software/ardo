import { useState, useEffect, useRef, useMemo } from "react"
import { Link, useNavigate } from "react-router"
import MiniSearch, { type SearchResult } from "minisearch"
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

export interface ArdoSearchProps {
  /** Placeholder text for the search input (default: "Search...") */
  placeholder?: string
}

export function ArdoSearch({ placeholder = "Search..." }: ArdoSearchProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasQuery = query.trim().length > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }

      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

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
  }, [isOpen])

  // Build search index from virtual module data
  const searchIndex = useMemo(() => {
    const index = new MiniSearch<SearchDoc>({
      fields: ["title", "content", "section"],
      storeFields: ["title", "path", "section"],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    })
    index.addAll(searchDocs as SearchDoc[])
    return index
  }, [])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)

    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      setSelectedIndex(0)
      return
    }

    const searchResults = searchIndex.search(searchQuery).slice(0, 10)
    setResults(searchResults)
    setSelectedIndex(0)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      const result = results[selectedIndex]
      navigate(result.path as string)
      setIsOpen(false)
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div
      className={styles.search}
      ref={containerRef}
      data-expanded={isOpen || hasQuery ? "true" : "false"}
      onClick={() => inputRef.current?.focus()}
    >
      <div className={styles.searchField}>
        <SearchIcon size={18} />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasQuery) {
              setIsOpen(true)
            }
          }}
          aria-expanded={isOpen}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={(e) => {
              e.stopPropagation()
              handleSearch("")
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

      {isOpen && hasQuery && (
        <div className={styles.searchPopover}>
          {results.length > 0 && (
            <ul className={styles.searchResults}>
              {results.map((result, index) => (
                <li key={result.id}>
                  <Link
                    to={result.path as string}
                    className={[styles.searchResult, index === selectedIndex && "selected"]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={styles.searchResultTitle}>{result.title as string}</span>
                    {result.section && (
                      <span className={styles.searchResultSection}>{result.section as string}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query && results.length === 0 && (
            <div className={styles.searchNoResults}>No results found for "{query}"</div>
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
        </div>
      )}
    </div>
  )
}
