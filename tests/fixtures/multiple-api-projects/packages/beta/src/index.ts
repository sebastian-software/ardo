/**
 * Capitalizes the first letter of a string.
 * @param input - The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(input: string): string {
  if (input.length === 0) return input
  return input.charAt(0).toUpperCase() + input.slice(1)
}

/**
 * Converts a string to a URL-friendly slug.
 * @param input - The string to slugify
 * @returns A lowercase, hyphen-separated slug
 *
 * @example
 * ```ts
 * slugify("Hello World!") // "hello-world"
 * ```
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Truncates a string to the specified length with an ellipsis.
 * @param input - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - The suffix to append (defaults to "...")
 * @returns The truncated string
 */
export function truncate(input: string, maxLength: number, suffix = "..."): string {
  if (input.length <= maxLength) return input
  return input.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Options for the repeat function.
 */
export interface RepeatOptions {
  /** The separator between repetitions */
  separator?: string
}

/**
 * Repeats a string a given number of times.
 * @param input - The string to repeat
 * @param count - Number of repetitions
 * @param options - Optional configuration
 * @returns The repeated string
 */
export function repeat(input: string, count: number, options?: RepeatOptions): string {
  const sep = options?.separator ?? ""
  return Array.from({ length: count }, () => input).join(sep)
}
