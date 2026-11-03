import type { loadSearchIndex } from "./search-index"

/** The subset of the WebMCP `document.modelContext` API this module uses. */
export type ModelContext = {
  registerTool: (tool: SearchWebMcpTool, options: { signal: AbortSignal }) => unknown
}

export type SearchWebMcpOptions = {
  /** Locale whose index site search uses, so the tool sees what readers see. */
  locale: string
  /** Site search's index loader, passed in so this module does not bundle a second copy. */
  loadIndex: typeof loadSearchIndex
  /** Turns an internal path into the href site search links to (base path included). */
  resolveHref: (to: string) => string
}

type SearchWebMcpTool = {
  name: string
  description: string
  inputSchema: object
  annotations: { readOnlyHint: true; untrustedContentHint: true }
  execute: (input: unknown, options: { signal: AbortSignal }) => Promise<SearchResponse>
}

/** The resolved value; the browser serializes it to JSON for the agent. */
type SearchResponse =
  { results: SearchResult[] } | { error: { code: SearchErrorCode; message: string } }

type SearchResult = { title: string; section?: string; url: string; excerpt: string }
type SearchErrorCode = "invalid_input" | "index_unavailable"

type SearchInput = { query: string; limit: number }

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20
const MAX_QUERY_LENGTH = 500
const MAX_EXCERPT_LENGTH = 1000

/** Contexts with a live registration; keeps a second mount from registering the same name. */
const activeContexts = new WeakSet<ModelContext>()

/**
 * Register `search_documentation` on a WebMCP model context. Each context gets the tool once, and
 * the tool is removed when `signal` aborts. Does nothing when the context has no `registerTool`.
 */
export function registerSearchWebMcp(
  context: ModelContext | undefined,
  options: SearchWebMcpOptions,
  signal: AbortSignal
): void {
  if (typeof context?.registerTool !== "function" || signal.aborted) return
  if (activeContexts.has(context)) return
  activeContexts.add(context)
  signal.addEventListener("abort", () => activeContexts.delete(context), { once: true })

  const tool: SearchWebMcpTool = {
    name: "search_documentation",
    description:
      "Search this documentation site for relevant pages and sections. Returns page titles, section headings, absolute URLs and plain-text excerpts.",
    inputSchema: {
      type: "object",
      required: ["query"],
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          minLength: 1,
          maxLength: MAX_QUERY_LENGTH,
          pattern: "\\S",
          description: "Words or phrases to search for.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
          default: DEFAULT_LIMIT,
          description: "Maximum number of results, from 1 to 20.",
        },
      },
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: (input, { signal: callSignal }) => executeSearch(input, options, callSignal),
  }
  try {
    void Promise.resolve(context.registerTool(tool, { signal })).catch(() => {
      activeContexts.delete(context)
    })
  } catch {
    activeContexts.delete(context)
  }
}

async function executeSearch(
  input: unknown,
  options: SearchWebMcpOptions,
  signal: AbortSignal
): Promise<SearchResponse> {
  const parsed = parseSearchInput(input)
  if (typeof parsed === "string") return errorResult("invalid_input", parsed)

  let index: Awaited<ReturnType<typeof loadSearchIndex>>
  try {
    // The index loads on the first call, not at registration.
    index = await options.loadIndex(options.locale)
  } catch {
    signal.throwIfAborted()
    return errorResult(
      "index_unavailable",
      "The documentation search index could not be loaded. Reload the page and try again."
    )
  }
  signal.throwIfAborted()

  const hits = index.search(parsed.query).slice(0, parsed.limit)
  const results = hits.flatMap((hit) => toSearchResult(hit, options))
  return { results }
}

/** Returns the parsed input, or the message for the first problem found. */
function parseSearchInput(input: unknown): SearchInput | string {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return "Input must be an object with a query string."
  }
  const { query, limit } = input as Record<string, unknown>
  if (typeof query !== "string" || query.trim() === "") {
    return "query must be a non-empty string."
  }
  const trimmed = query.trim()
  if ([...trimmed].length > MAX_QUERY_LENGTH) {
    return `query must be at most ${MAX_QUERY_LENGTH} characters.`
  }
  if (limit !== undefined && (typeof limit !== "number" || !Number.isInteger(limit))) {
    return "limit must be an integer."
  }
  const requested = limit ?? DEFAULT_LIMIT
  return { query: trimmed, limit: Math.min(MAX_LIMIT, Math.max(1, requested)) }
}

/**
 * Maps an index hit to the tool's result. `title` is the page title; `section` is the heading the
 * hit points into, when it is not the page itself.
 */
function toSearchResult(hit: unknown, options: SearchWebMcpOptions): SearchResult[] {
  if (typeof hit !== "object" || hit === null) return []
  const fields = hit as Record<string, unknown>
  if (typeof fields.path !== "string") return []

  const hitTitle = typeof fields.title === "string" ? fields.title : ""
  const pageTitle = typeof fields.pageTitle === "string" ? fields.pageTitle : hitTitle
  const excerpt = typeof fields.excerpt === "string" ? fields.excerpt : ""
  const url = new URL(options.resolveHref(fields.path), globalThis.location.origin).href
  return [
    {
      title: pageTitle,
      ...(hitTitle !== "" && hitTitle !== pageTitle ? { section: hitTitle } : {}),
      url,
      excerpt: [...excerpt].slice(0, MAX_EXCERPT_LENGTH).join(""),
    },
  ]
}

function errorResult(code: SearchErrorCode, message: string): SearchResponse {
  return { error: { code, message } }
}
