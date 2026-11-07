import type { ArdoConfig } from "./types"

/**
 * RFC 3339 timestamp with a time zone, the format Ardo accepts for `buildTime` and for the
 * `publishedAt` and `updatedAt` dates of posts. A value without a zone would depend on the time
 * zone of the build machine.
 */
const TIMESTAMP_PATTERN = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/u

/**
 * Checks a configured timestamp and returns why it is invalid, or `undefined` when it is valid.
 * The reason is a sentence fragment such as `must contain a valid calendar date.`, so each caller
 * prefixes it with the field it reports.
 */
export function timestampError(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !TIMESTAMP_PATTERN.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    return "must be an RFC 3339 timestamp with a time zone."
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate())
    return "must contain a valid calendar date."
  return undefined
}

/**
 * Narrows a value to a valid timestamp string: `true` exactly when `timestampError` finds no
 * reason, so a caller that checked the reason first can use the value as a string.
 */
export function isTimestamp(value: unknown): value is string {
  return timestampError(value) === undefined
}

/**
 * Normalizes a timestamp that passed `timestampError` to the UTC form of
 * `Date.prototype.toISOString()`, so equal moments compare as equal strings.
 */
export function canonicalTimestamp(value: string): string {
  return new Date(value).toISOString()
}

/** Adds the `validateConfig` error for an invalid `buildTime`, such as `buildTime must …`. */
export function validateBuildTimeConfig(config: ArdoConfig, errors: string[]): void {
  if (config.buildTime === undefined) return
  const reason = timestampError(config.buildTime)
  if (reason !== undefined) errors.push(`buildTime ${reason}`)
}

/**
 * Validates the configured `buildTime` before any hook uses it and returns its canonical form,
 * or `undefined` when the site does not pin its build moment.
 */
export function resolvePinnedBuildTime(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const reason = timestampError(value)
  if (reason !== undefined) throw new Error(`[ardo] buildTime ${reason}`)
  return canonicalTimestamp(value)
}

/** Pinned moments already reported in this process; one command creates several plugins. */
const reportedBuildTimes = new Set<string>()

/**
 * Prints the pinned moment once per process and moment, as a warning when it lies in the future,
 * because then the publication shows posts that are not due yet.
 */
export function reportPinnedBuildTime(buildTime: string): void {
  if (reportedBuildTimes.has(buildTime)) return
  reportedBuildTimes.add(buildTime)
  if (Date.parse(buildTime) > Date.now()) {
    console.warn(
      `[ardo] Build time pinned to ${buildTime} (buildTime), which is in the future. Posts scheduled up to that moment are published.`
    )
  } else {
    console.log(`[ardo] Build time pinned to ${buildTime} (buildTime).`)
  }
}

/** Test-only: forgets which pinned moments were reported, so each test sees the first report. */
export function resetBuildTimeLogForTests(): void {
  reportedBuildTimes.clear()
}
