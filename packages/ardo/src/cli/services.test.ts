import { mkdtemp, readdir, rm } from "node:fs/promises"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { runCli } from "./run"
import { createCliServices } from "./services"

describe("Ardo's installed app-tracking integration", () => {
  const roots: string[] = []
  beforeEach(() => {
    for (const key of [
      "CI",
      "CONTINUOUS_INTEGRATION",
      "DO_NOT_TRACK",
      "APP_TRACKING_TELEMETRY",
      "APP_TRACKING_CI",
      "ARDO_OFFLINE",
      "ARDO_UPDATE_CHECK",
    ])
      vi.stubEnv(key, undefined)
  })
  afterEach(async () => {
    vi.unstubAllEnvs()
    for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
  })
  async function fixture() {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-sdk-test-"))
    roots.push(root)
    const options = {
      version: "6.0.0",
      stateRoot: path.join(root, "private"),
      origin: "http://127.0.0.1:1",
    }
    return { root, options, services: createCliServices(options) }
  }

  it("registers Ardo without collecting or creating state before consent", async () => {
    const { services, root } = await fixture()
    expect(await readdir(root)).toStrictEqual([])
    expect(await services.recordInvocation("build")).toStrictEqual({
      ok: true,
      value: "suppressed",
    })
    const completion = await services.complete()
    const status = await services.status()
    expect(completion.reporting).toStrictEqual({ ok: true, value: false })
    expect(status.reporting.decision).toBe("undecided")
    expect(await readdir(root)).toStrictEqual([])
  })

  it("uses real SDK consent, Ardo command mapping, withdrawal, and pending offline deletion", async () => {
    vi.stubEnv("ARDO_OFFLINE", "1")
    const { options, services } = await fixture()
    const stdout = { write: vi.fn().mockReturnValue(true) }
    expect(
      await runCli(["telemetry", "enable", "--yes"], { services, stdout, stderr: stdout })
    ).toStrictEqual({ type: "exit", code: 0 })
    const commandServices = createCliServices(options)
    expect(
      await runCli(["build"], {
        services: commandServices,
        stdout,
        stderr: stdout,
        runVite: async () => ({ code: 0 }),
      })
    ).toStrictEqual({ type: "exit", code: 0 })
    const preview = await commandServices.preview()
    expect(preview.open).toStrictEqual([
      expect.objectContaining({
        tool_version: "6.0.0",
        metric: "cli.invocation",
        dimensions: { command: "build" },
        count: 1,
      }),
    ])
    const withdrawal = await services.withdrawReporting()
    expect(withdrawal.reporting.collectOptIn).toBe(false)
    expect(await services.preview()).toStrictEqual({ open: [], batches: [] })
    const deletion = await services.deleteReporting()
    expect(deletion.deletion).toBe("pending")
    expect(deletion.handedOff).toBe(false)
    const status = await services.status()
    expect(status.reporting.deletionPending).toBe(true)
    expect(await services.checkForUpdates()).toStrictEqual({ ok: true, value: undefined })
  })

  it("uses the SDK's update route and cache without creating a reporting profile", async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(String(request.url))
      const now = Date.now()
      response.setHeader("Content-Type", "application/json")
      response.end(
        JSON.stringify({
          schema_version: 1,
          tool_id: "ardo",
          distribution: "github",
          channel: "stable",
          latest_version: "99.0.0",
          published_at: new Date(now - 86_400_000).toISOString(),
          checked_at: new Date(now - 60_000).toISOString(),
          stale: false,
          release_url: "https://github.com/sebastian-software/ardo/releases/tag/ardo-v99.0.0",
        })
      )
    })
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve)
    })
    try {
      const address = server.address() as AddressInfo
      const { options } = await fixture()
      options.origin = `http://127.0.0.1:${address.port}`
      const services = createCliServices(options)
      const result = await services.checkForUpdates()
      expect(result).toMatchObject({ ok: true, value: { latestVersion: "99.0.0" } })
      await services.complete()
      expect(await createCliServices(options).checkForUpdates()).toStrictEqual({
        ok: true,
        value: undefined,
      })
      expect(requests).toStrictEqual(["/v1/versions/ardo/github/stable"])
      expect(await readdir(options.stateRoot)).toStrictEqual(["updates"])
    } finally {
      await promisify(server.close.bind(server))()
    }
  })

  it("maps Ardo's update-disable setting to the SDK without filesystem or network work", async () => {
    vi.stubEnv("ARDO_UPDATE_CHECK", "0")
    const { root, services } = await fixture()
    expect(await services.checkForUpdates()).toStrictEqual({ ok: true, value: undefined })
    await services.complete()
    expect(await readdir(root)).toStrictEqual([])
  })
})
