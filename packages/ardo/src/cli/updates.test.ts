import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { automaticUpdatesAllowed, checkForUpdates } from "./updates"

const now = Date.parse("2026-10-30T12:00:00Z")
function release(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    tool_id: "ardo",
    distribution: "github",
    channel: "stable",
    latest_version: "6.1.0",
    published_at: "2026-10-29T10:00:00Z",
    checked_at: "2026-10-30T11:30:00Z",
    stale: false,
    release_url: "https://untrusted.example/never-use-this",
    ...overrides,
  }
}

describe("public version checks", () => {
  const roots: string[] = []
  afterEach(async () => {
    for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
  })
  async function fixture(body = release()) {
    const stateRoot = await mkdtemp(path.join(tmpdir(), "ardo-updates-test-"))
    roots.push(stateRoot)
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () => Response.json(body))
    return { version: "6.0.0", stateRoot, env: {}, fetch, now: () => now }
  }

  it("uses only the public route, honors DNT, and reuses an hourly cache", async () => {
    const options = await fixture()
    options.env = { DO_NOT_TRACK: "1" }
    const value = await checkForUpdates(options)
    expect(value).toStrictEqual({
      latest: "6.1.0",
      newer: true,
      releaseUrl: "https://github.com/sebastian-software/ardo/releases/tag/ardo-v6.1.0",
    })
    expect(options.fetch).toHaveBeenCalledWith(
      "https://app-tracking.sebastian-software.com/v1/versions/ardo/github/stable",
      expect.objectContaining({
        headers: { Accept: "application/json", DNT: "1", "Sec-GPC": "1" },
        redirect: "error",
        credentials: "omit",
      })
    )
    expect(await checkForUpdates(options)).toStrictEqual(value)
    expect(options.fetch).toHaveBeenCalledOnce()
    await checkForUpdates({ ...options, now: () => now + 3_600_000 })
    expect(options.fetch).toHaveBeenCalledTimes(2)
  })

  it.each([{ ARDO_OFFLINE: "1" }, { ARDO_UPDATE_CHECK: "0" }])(
    "does not access the network or create state when disabled: %j",
    async (env) => {
      const options = await fixture()
      expect(await checkForUpdates({ ...options, env })).toBeUndefined()
      expect(options.fetch).not.toHaveBeenCalled()
      expect(await readdir(options.stateRoot)).toStrictEqual([])
    }
  )

  it("does not notify automatically in CI, independently of usage consent", () => {
    expect(automaticUpdatesAllowed({ CI: "1" })).toBe(false)
    expect(automaticUpdatesAllowed({ CONTINUOUS_INTEGRATION: "true" })).toBe(false)
    expect(automaticUpdatesAllowed({ DO_NOT_TRACK: "1", APP_TRACKING_TELEMETRY: "off" })).toBe(true)
  })

  it("does not check stable releases for a prerelease installation", async () => {
    const options = await fixture()
    expect(await checkForUpdates({ ...options, version: "6.2.0-beta.1" })).toBeUndefined()
    expect(options.fetch).not.toHaveBeenCalled()
  })

  it.each([
    { tool_id: "dalo" },
    { distribution: "npm" },
    { channel: "nightly" },
    { latest_version: "6.1.0\nrun something" },
    { latest_version: "6.1.0-beta.1" },
    { checked_at: "2026-10-29T12:00:00Z" },
    { checked_at: "2026-10-30T13:00:00Z" },
    { published_at: "2026-10-31T12:00:00Z" },
    { schema_version: 2 },
  ])("rejects invalid release metadata: %j", async (overrides) => {
    expect(await checkForUpdates(await fixture(release(overrides)))).toBeUndefined()
  })

  it.each(["6.1.0", "6.2.0"])(
    "does not recommend an older/equal stable release over %s",
    async (version) => {
      const result = await checkForUpdates({ ...(await fixture()), version })
      expect(result).toMatchObject({ newer: false })
    }
  )

  it("bounds response size and suppresses repeated failures for one minute", async () => {
    const options = await fixture()
    options.fetch.mockImplementation(async () => new Response(" ".repeat(16_385)))
    expect(await checkForUpdates(options)).toBeUndefined()
    expect(await checkForUpdates(options)).toBeUndefined()
    expect(options.fetch).toHaveBeenCalledOnce()
    await checkForUpdates({ ...options, now: () => now + 60_000 })
    expect(options.fetch).toHaveBeenCalledTimes(2)
  })

  it("cancels a pending network request at the host command boundary", async () => {
    const options = await fixture()
    const controller = new AbortController()
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    options.fetch.mockImplementation(
      async (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => reject(new Error("aborted")), {
            once: true,
          })
          started()
        })
    )
    const pending = checkForUpdates({ ...options, signal: controller.signal })
    await ready
    controller.abort()
    expect(await pending).toBeUndefined()
    expect(await readdir(options.stateRoot)).toStrictEqual([])
  })
})
