/**
 * Configuration options for the formatter.
 */
export interface FormatOptions {
  /** Whether to use uppercase */
  uppercase?: boolean
  /** Custom separator character */
  separator?: string
  /** Maximum length of the output */
  maxLength?: number
}

/**
 * A simple key-value store.
 *
 * @example
 * ```ts
 * const store = new Store<string>()
 * store.set("key", "value")
 * console.log(store.get("key")) // "value"
 * ```
 */
export class Store<T> {
  private data = new Map<string, T>()

  /**
   * Retrieves a value by key.
   * @param key - The key to look up
   * @returns The stored value, or undefined if not found
   */
  get(key: string): T | undefined {
    return this.data.get(key)
  }

  /**
   * Stores a value with the given key.
   * @param key - The key to store under
   * @param value - The value to store
   */
  set(key: string, value: T): void {
    this.data.set(key, value)
  }

  /**
   * Checks whether a key exists in the store.
   * @param key - The key to check
   * @returns True if the key exists
   */
  has(key: string): boolean {
    return this.data.has(key)
  }

  /**
   * Removes a key from the store.
   * @param key - The key to remove
   * @returns True if the key was found and removed
   */
  delete(key: string): boolean {
    return this.data.delete(key)
  }

  /** Returns the number of entries in the store. */
  get size(): number {
    return this.data.size
  }
}

/**
 * Formats a string by applying the given options.
 *
 * @param input - The input string to format
 * @param options - Formatting options
 * @returns The formatted string
 *
 * @example
 * ```ts
 * format("hello world") // "hello world"
 * format("hello world", { uppercase: true }) // "HELLO WORLD"
 * format("hello world", { separator: "-" }) // "hello-world"
 * ```
 */
export function format(input: string, options?: FormatOptions): string {
  let result = input

  if (options?.separator) {
    result = result.replace(/\s+/g, options.separator)
  }

  if (options?.uppercase) {
    result = result.toUpperCase()
  }

  if (options?.maxLength && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength)
  }

  return result
}

/**
 * Parses a delimited string into an array of trimmed values.
 *
 * @param input - The delimited string
 * @param delimiter - The delimiter to split on (defaults to ",")
 * @returns An array of trimmed strings
 */
export function parse(input: string, delimiter = ","): string[] {
  return input.split(delimiter).map((s) => s.trim())
}

/**
 * Creates a slug from the given string.
 *
 * @param input - The string to slugify
 * @returns A URL-friendly slug
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
