import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { ardoStateRoot, enabled, isCi, trackingOrigin } from "./tracking"

const hour = 3_600_000
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u
const endpoint = `${trackingOrigin}/v1/versions/ardo/github/stable`

type CachedRelease = { attemptedAt: number; latest: string | null }
export type UpdateResult = { latest: string; newer: boolean; releaseUrl: string }
type UpdateOptions = {
  version: string
  stateRoot?: string
  env?: NodeJS.ProcessEnv
  fetch?: typeof fetch
  now?: () => number
  signal?: AbortSignal
}

export function automaticUpdatesAllowed(env: NodeJS.ProcessEnv): boolean {
  return !isCi(env) && !enabled(env.ARDO_OFFLINE) && env.ARDO_UPDATE_CHECK !== "0"
}

/** The Node SDK currently exposes events only; updates use the public version API. */
export async function checkForUpdates(options: UpdateOptions): Promise<UpdateResult | undefined> {
  const env = options.env ?? process.env
  if (enabled(env.ARDO_OFFLINE) || env.ARDO_UPDATE_CHECK === "0") return
  // Development/prerelease versions do not participate in stable release notices.
  if (!stableVersion.test(options.version)) return
  const now = (options.now ?? Date.now)()
  const cachePath = path.join(options.stateRoot ?? ardoStateRoot(), "updates", "latest.json")
  const cached = await readCache(cachePath)
  if (
    cached &&
    now >= cached.attemptedAt &&
    now - cached.attemptedAt < (cached.latest === null ? 60_000 : hour)
  ) {
    return result(cached.latest, options.version)
  }

  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(1500)])
    : AbortSignal.timeout(1500)
  let latest: string | null = null
  try {
    const response = await (options.fetch ?? fetch)(endpoint, {
      headers: {
        Accept: "application/json",
        ...(enabled(env.DO_NOT_TRACK) ? { DNT: "1", "Sec-GPC": "1" } : {}),
      },
      redirect: "error",
      credentials: "omit",
      signal,
    })
    if (response.ok) latest = await readRelease(response, now)
    else await response.body?.cancel()
  } catch {
    // Update availability never determines whether Ardo can run.
  }
  if (!options.signal?.aborted) await saveCache(cachePath, { attemptedAt: now, latest })
  return result(latest, options.version)
}

async function readJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    for (;;) {
      const next = await reader.read()
      if (next.done) break
      length += next.value.byteLength
      if (length > 16_384) return null
      chunks.push(next.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } finally {
    await reader.cancel().catch(() => {
      /* A failed stream may already be closed. */
    })
    reader.releaseLock()
  }
}

async function readRelease(response: Response, now: number): Promise<string | null> {
  const value = await readJson(response)
  if (typeof value !== "object" || value === null) return null
  const row = value as Record<string, unknown>
  if (
    row.schema_version !== 1 ||
    row.tool_id !== "ardo" ||
    row.distribution !== "github" ||
    row.channel !== "stable" ||
    typeof row.latest_version !== "string" ||
    !stableVersion.test(row.latest_version) ||
    typeof row.checked_at !== "string" ||
    typeof row.published_at !== "string" ||
    typeof row.stale !== "boolean"
  )
    return null
  const checkedAt = Date.parse(row.checked_at)
  const publishedAt = Date.parse(row.published_at)
  if (
    !Number.isFinite(checkedAt) ||
    !Number.isFinite(publishedAt) ||
    checkedAt > now + 300_000 ||
    now - checkedAt >= 24 * hour ||
    publishedAt > checkedAt
  )
    return null
  return row.latest_version
}

function result(latest: string | null, installed: string): UpdateResult | undefined {
  if (latest === null) return
  const current = installed.split(".").map(BigInt)
  const next = latest.split(".").map(BigInt)
  let newer = false
  for (let index = 0; index < 3; index++) {
    if (next[index] === current[index]) continue
    newer = next[index] > current[index]
    break
  }
  return {
    latest,
    newer,
    releaseUrl: `https://github.com/sebastian-software/ardo/releases/tag/ardo-v${latest}`,
  }
}

async function readCache(file: string): Promise<CachedRelease | undefined> {
  try {
    const value: unknown = JSON.parse(await readFile(file, "utf8"))
    if (typeof value !== "object" || value === null) return
    const row = value as Record<string, unknown>
    if (
      typeof row.attemptedAt === "number" &&
      Number.isFinite(row.attemptedAt) &&
      (row.latest === null || (typeof row.latest === "string" && stableVersion.test(row.latest)))
    )
      return { attemptedAt: row.attemptedAt, latest: row.latest }
  } catch {
    // Missing or invalid caches can be replaced by a validated service response.
  }
}

async function saveCache(file: string, value: CachedRelease): Promise<void> {
  const temporary = `${file}.${randomUUID()}.tmp`
  try {
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
    await writeFile(temporary, JSON.stringify(value), { mode: 0o600, flag: "wx" })
    await rename(temporary, file)
  } catch {
    // Read-only home directories do not disable the CLI.
  } finally {
    await rm(temporary, { force: true }).catch(() => {
      /* Cache cleanup is best effort. */
    })
  }
}
