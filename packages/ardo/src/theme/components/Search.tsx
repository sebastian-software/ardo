import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "@tanstack/react-router"
import { useThemeConfig } from "../../runtime/hooks"
import MiniSearch, { type SearchResult } from "minisearch"

interface SearchDoc {
  id: string
  title: string
  content: string
  path: string
  section?: string
}

let searchIndex: MiniSearch<SearchDoc> | null = null

export function Search() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const themeConfig = useThemeConfig()

  const placeholder = themeConfig.search?.placeholder ?? "Search..."

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
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
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  const loadSearchIndex = useCallback(async () => {
    if (searchIndex) return searchIndex

    try {
      const response = await fetch("/_press/search-index.json")
      if (!response.ok) return null

      const docs: SearchDoc[] = await response.json()

      searchIndex = new MiniSearch<SearchDoc>({
        fields: ["title", "content", "section"],
        storeFields: ["title", "path", "section"],
        searchOptions: {
          boost: { title: 2 },
          fuzzy: 0.2,
          prefix: true,
        },
      })

      searchIndex.addAll(docs)
      return searchIndex
    } catch {
      return null
    }
  }, [])

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery)

      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      const index = await loadSearchIndex()
      if (!index) {
        setResults([])
        return
      }

      const searchResults = index.search(searchQuery).slice(0, 10)
      setResults(searchResults)
      setSelectedIndex(0)
    },
    [loadSearchIndex]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      const result = results[selectedIndex]
      window.location.href = result.path as string
      setIsOpen(false)
    }
  }

  return (
    <>
      <button className="press-search-button" onClick={() => setIsOpen(true)} aria-label="Search">
        <SearchIcon />
        <span className="press-search-button-text">{placeholder}</span>
        <span className="press-search-kbd">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      {isOpen && (
        <div className="press-search-modal" onClick={() => setIsOpen(false)}>
          <div className="press-search-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="press-search-input-wrapper">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                className="press-search-input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  className="press-search-clear"
                  onClick={() => handleSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {results.length > 0 && (
              <ul className="press-search-results">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <Link
                      to={result.path as string}
                      className={["press-search-result", index === selectedIndex && "selected"]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="press-search-result-title">{result.title as string}</span>
                      {result.section && (
                        <span className="press-search-result-section">
                          {result.section as string}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {query && results.length === 0 && (
              <div className="press-search-no-results">No results found for "{query}"</div>
            )}

            <div className="press-search-footer">
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
        </div>
      )}
    </>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
