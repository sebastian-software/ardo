import { createHash } from "node:crypto"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Persistent per-file results of deterministic build steps, kept in
 * `node_modules/.cache/ardo`. Each entry is one JSON file named by the hash of everything its
 * result depends on, so a changed input never reads a stale entry. Set `ARDO_CACHE=false` to
 * bypass it.
 */
export type BuildCache = {
  readonly directory: string
  read: <T>(namespace: string, key: string) => T | undefined
  write: (namespace: string, key: string, value: unknown) => void
}

/** Bump when a cached shape changes without a package version change. */
const CACHE_FORMAT = 1

/**
 * How long an entry survives without any build reading or writing it. A project may run several
 * builds in a row from one root (one per language variant, or per content directory), and each
 * uses only part of the cache, so pruning by this process's use alone would delete the others'
 * entries. A week keeps every variant that is built at least weekly warm, while entries for
 * changed or deleted sources still disappear.
 */
export const BUILD_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const caches = new Map<string, BuildCache>()
/** Entries this process read or wrote, by namespace directory. Pruning never removes them. */
const usedEntries = new Map<string, Set<string>>()

/** The project's build cache, or undefined when `ARDO_CACHE` turns it off. */
export function getBuildCache(root: string): BuildCache | undefined {
  if (isCacheDisabled(process.env.ARDO_CACHE)) return undefined
  const directory = path.join(root, "node_modules", ".cache", "ardo")
  let cache = caches.get(directory)
  if (cache == null) {
    cache = createBuildCache(directory)
    caches.set(directory, cache)
  }
  return cache
}

function isCacheDisabled(value: string | undefined): boolean {
  return value === "false" || value === "0" || value === "off"
}

function createBuildCache(directory: string): BuildCache {
  return {
    directory,
    read<T>(namespace: string, key: string): T | undefined {
      const file = entryFile(directory, namespace, key)
      let text: string
      try {
        text = fs.readFileSync(file, "utf8")
      } catch {
        return undefined
      }
      try {
        const value = JSON.parse(text) as T
        markUsed(file)
        touch(file)
        return value
      } catch {
        // A torn or foreign file is a miss; the next write replaces it.
        return undefined
      }
    },
    write(namespace: string, key: string, value: unknown): void {
      // Only plain JSON round-trips unchanged; anything else is recomputed every time.
      if (!isJsonValue(value)) return
      const file = entryFile(directory, namespace, key)
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        const temporary = `${file}.${process.pid}.tmp`
        fs.writeFileSync(temporary, JSON.stringify(value))
        fs.renameSync(temporary, file)
        markUsed(file)
      } catch {
        // A read-only or full disk leaves the build uncached, never broken.
      }
    },
  }
}

function entryFile(directory: string, namespace: string, key: string): string {
  return path.join(directory, namespace, `${key}.json`)
}

/** A hit renews the entry's modification time, the last use that pruning measures age by. */
function touch(file: string): void {
  try {
    const now = new Date()
    fs.utimesSync(file, now, now)
  } catch {
    // A read-only cache still serves hits; its entries just age from their last write.
  }
}

function markUsed(file: string): void {
  const directory = path.dirname(file)
  let entries = usedEntries.get(directory)
  if (entries == null) {
    entries = new Set()
    usedEntries.set(directory, entries)
  }
  entries.add(path.basename(file))
}

/**
 * Delete entries that no build has read or written for `BUILD_CACHE_MAX_AGE_MS`, in every
 * namespace. Entries of other builds in the same project, including ones running at the same
 * time, stay as long as they are in use; entries for changed or deleted sources, retired
 * namespaces, and torn temporary files age out.
 */
export function pruneBuildCache(cache: BuildCache | undefined, now = Date.now()): void {
  if (cache == null) return
  const cutoff = now - BUILD_CACHE_MAX_AGE_MS
  for (const namespace of listDirectory(cache.directory)) {
    const directory = path.join(cache.directory, namespace)
    const used = usedEntries.get(directory)
    for (const file of listDirectory(directory)) {
      if (used?.has(file) !== true) removeUnusedSince(path.join(directory, file), cutoff)
    }
  }
}

function removeUnusedSince(entry: string, cutoff: number): void {
  try {
    if (fs.statSync(entry).mtimeMs < cutoff) fs.rmSync(entry, { force: true })
  } catch {
    // A read-only cache keeps its stale entries; they never match a current key.
  }
}

function listDirectory(directory: string): string[] {
  try {
    return fs.readdirSync(directory)
  } catch {
    return []
  }
}

/**
 * The hash of everything a cached result depends on. Functions count by their source text,
 * so editing a configured callback invalidates the entries that used it.
 */
export function buildCacheKey(...parts: unknown[]): string {
  const hash = createHash("sha256")
  hash.update(JSON.stringify([CACHE_FORMAT, toolchainVersions(), parts], stableReplacer))
  return hash.digest("hex").slice(0, 40)
}

function stableReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "function") return `function:${String(value)}`
  if (typeof value === "bigint") return `bigint:${value}`
  if (value instanceof Map) return { map: [...value.entries()] }
  if (value instanceof Set) return { set: [...value] }
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
        .map((key) => [key, record[key]])
    )
  }
  return value
}

let versions: Record<string, string | null> | undefined

/** Ardo and the packages that shape cached results; an upgrade of any of them is a miss. */
function toolchainVersions(): Record<string, string | null> {
  versions ??= Object.fromEntries(
    ["ardo", "ferromark", "@ferriki/core", "@ferrigura/core", "vite", "sharp"].map((name) => [
      name,
      packageVersion(name),
    ])
  )
  return versions
}

const require = createRequire(import.meta.url)

function packageVersion(name: string): string | null {
  try {
    const start = name === "ardo" ? import.meta.filename : resolveEntry(name)
    return findPackageVersion(path.dirname(start), name)
  } catch {
    return null
  }
}

/** Resolved from Ardo itself; ESM-only packages may expose no `require` entry. */
function resolveEntry(name: string): string {
  try {
    return require.resolve(`${name}/package.json`)
  } catch {
    return fileURLToPath(import.meta.resolve(name))
  }
}

function findPackageVersion(directory: string, name: string): string | null {
  let current = directory
  for (;;) {
    const file = path.join(current, "package.json")
    if (fs.existsSync(file)) {
      const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as {
        name?: string
        version?: string
      }
      if (manifest.name === name) return manifest.version ?? null
    }
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

/** True for values that `JSON.stringify` and `JSON.parse` reproduce exactly. */
export function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every((entry) => entry !== undefined && isJsonValue(entry))
  if (typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return Object.values(value).every((entry) => entry === undefined || isJsonValue(entry))
}
