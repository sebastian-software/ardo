import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createTracking, trackingPackage, type TrackingClient } from "./tracking"

function fixture(env: NodeJS.ProcessEnv = {}) {
  const client: TrackingClient = {
    record: vi.fn().mockResolvedValue("counted"),
    flushInBackground: vi.fn().mockResolvedValue(false),
    setOptIn: vi.fn().mockResolvedValue(undefined),
    setDisabled: vi.fn().mockResolvedValue(undefined),
    status: vi.fn().mockResolvedValue({ decision: "undecided", collectOptIn: false }),
    preview: vi.fn().mockResolvedValue({ open: [], batches: [] }),
    delete: vi.fn().mockResolvedValue(undefined),
  }
  const createClient = vi.fn().mockResolvedValue(client)
  return { client, createClient, tracking: createTracking({ version: "6.0.0", env, createClient }) }
}

describe("CLI usage reporting", () => {
  it("loads the SDK lazily, records only finite command categories, and hands off delivery", async () => {
    const { client, createClient, tracking } = fixture()
    expect(createClient).not.toHaveBeenCalled()
    await tracking.record("build")
    await tracking.record("dev")
    expect(createClient).toHaveBeenCalledTimes(1)
    expect(client.record).toHaveBeenNthCalledWith(1, "cli.invocation", { command: "build" })
    expect(client.record).toHaveBeenNthCalledWith(2, "cli.invocation", { command: "dev" })
    expect(client.flushInBackground).toHaveBeenCalledTimes(2)
    expect(client.setOptIn).not.toHaveBeenCalled()
  })

  it.each([
    { CI: "true" },
    { CONTINUOUS_INTEGRATION: "1" },
    { DO_NOT_TRACK: "1" },
    { APP_TRACKING_TELEMETRY: "off" },
  ])("does not load reporting under a host veto: %j", async (env) => {
    const { createClient, tracking } = fixture(env)
    await tracking.record("preview")
    expect(createClient).not.toHaveBeenCalled()
  })

  it("keeps SDK failures from affecting a command", async () => {
    const { client, tracking } = fixture()
    vi.mocked(client.record).mockRejectedValue(new Error("Busy"))
    await expect(tracking.record("build")).resolves.toBeUndefined()
    expect(client.flushInBackground).not.toHaveBeenCalled()
  })

  it("exposes inspect, withdrawal, and deletion without recording settings activity", async () => {
    const { client, tracking } = fixture()
    await tracking.settings("status")
    await tracking.settings("preview")
    await tracking.settings("enable")
    await tracking.settings("disable")
    await tracking.settings("delete")
    expect(client.setOptIn).toHaveBeenNthCalledWith(1, true)
    expect(client.setDisabled).toHaveBeenCalledWith(false)
    expect(client.setOptIn).toHaveBeenNthCalledWith(2, false)
    expect(client.delete).toHaveBeenCalledOnce()
    expect(client.flushInBackground).toHaveBeenCalledOnce()
    expect(client.record).not.toHaveBeenCalled()
  })
})

const sdk = await import(trackingPackage).catch(() => null)

describe("installed Node SDK boundary", () => {
  const roots: string[] = []
  afterEach(async () => {
    for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it.skipIf(sdk === null)("collects nothing before consent with the shipped SDK", async () => {
    // Use a currently registered tool to exercise the real SDK's permission boundary.
    // Ardo's catalog entry is a separate upstream rollout prerequisite.
    const { Client } = sdk
    for (const name of ["CI", "CONTINUOUS_INTEGRATION", "DO_NOT_TRACK", "APP_TRACKING_TELEMETRY"])
      vi.stubEnv(name, undefined)
    const root = await mkdtemp(path.join(tmpdir(), "ardo-sdk-test-"))
    roots.push(root)
    const client = new Client({
      origin: "http://127.0.0.1:1",
      stateRoot: path.join(root, "private"),
      tool: "dalo",
      version: "6.0.0",
      interaction: "never",
    })
    expect(await client.record("cli.invocation", { command: "other" })).toBe("suppressed")
    expect(await client.flushInBackground()).toBe(false)
    expect(await readdir(root)).toStrictEqual([])
  })
})
