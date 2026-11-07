import { afterEach, describe, expect, it, vi } from "vitest"

import {
  canonicalTimestamp,
  isTimestamp,
  reportPinnedBuildTime,
  resetBuildTimeLogForTests,
  resolvePinnedBuildTime,
  timestampError,
  validateBuildTimeConfig,
} from "./build-time"

const ZONE = "must be an RFC 3339 timestamp with a time zone."
const CALENDAR = "must contain a valid calendar date."

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  resetBuildTimeLogForTests()
})

describe("timestampError", () => {
  it("accepts a UTC timestamp and a timestamp with an offset", () => {
    expect(timestampError("2026-10-15T00:00:00Z")).toBeUndefined()
    expect(timestampError("2026-12-01T00:00:00+01:00")).toBeUndefined()
  })

  it("rejects a timestamp without a time zone, a date only and a non-string", () => {
    expect(timestampError("2026-12-01T00:00:00")).toBe(ZONE)
    expect(timestampError("2026-12-01")).toBe(ZONE)
    expect(timestampError(new Date("2026-12-01T00:00:00Z"))).toBe(ZONE)
    expect(timestampError(1_790_000_000)).toBe(ZONE)
  })

  it("rejects an impossible calendar date", () => {
    expect(timestampError("2026-02-30T00:00:00Z")).toBe(CALENDAR)
  })
})

describe("isTimestamp", () => {
  it("is true exactly when timestampError finds no reason", () => {
    expect(isTimestamp("2026-10-15T00:00:00Z")).toBe(true)
    expect(isTimestamp("2026-12-01T00:00:00")).toBe(false)
    expect(isTimestamp("2026-02-30T00:00:00Z")).toBe(false)
    expect(isTimestamp(1_790_000_000)).toBe(false)
  })
})

describe("canonicalTimestamp", () => {
  it("normalizes to UTC with milliseconds", () => {
    expect(canonicalTimestamp("2026-10-15T00:00:00Z")).toBe("2026-10-15T00:00:00.000Z")
    expect(canonicalTimestamp("2026-12-01T00:00:00+01:00")).toBe("2026-11-30T23:00:00.000Z")
  })
})

describe("validateBuildTimeConfig", () => {
  it("adds nothing when buildTime is absent or valid", () => {
    const errors: string[] = []
    validateBuildTimeConfig({ title: "Docs" }, errors)
    validateBuildTimeConfig({ title: "Docs", buildTime: "2026-10-15T00:00:00Z" }, errors)
    expect(errors).toStrictEqual([])
  })

  it("adds the prefixed reason for an invalid value", () => {
    const errors: string[] = []
    validateBuildTimeConfig({ title: "Docs", buildTime: "2026-12-01" }, errors)
    expect(errors).toStrictEqual([`buildTime ${ZONE}`])
  })
})

describe("resolvePinnedBuildTime", () => {
  it("leaves an unset buildTime unset", () => {
    expect(resolvePinnedBuildTime(undefined)).toBeUndefined()
  })

  it("returns the canonical form of a valid value", () => {
    expect(resolvePinnedBuildTime("2026-12-01T00:00:00+01:00")).toBe("2026-11-30T23:00:00.000Z")
  })

  it("throws the exact plugin errors", () => {
    expect(() => resolvePinnedBuildTime("2026-12-01T00:00:00")).toThrow(`[ardo] buildTime ${ZONE}`)
    expect(() => resolvePinnedBuildTime("2026-02-30T00:00:00Z")).toThrow(
      `[ardo] buildTime ${CALENDAR}`
    )
  })
})

function pinNow() {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-07T00:00:00Z"))
  return {
    log: vi.spyOn(console, "log").mockImplementation(vi.fn()),
    warn: vi.spyOn(console, "warn").mockImplementation(vi.fn()),
  }
}

describe("reportPinnedBuildTime", () => {
  it("prints an info line once per moment", () => {
    const { log, warn } = pinNow()
    reportPinnedBuildTime("2026-10-15T00:00:00.000Z")
    reportPinnedBuildTime("2026-10-15T00:00:00.000Z")
    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(
      "[ardo] Build time pinned to 2026-10-15T00:00:00.000Z (buildTime)."
    )
    expect(warn).not.toHaveBeenCalled()
    reportPinnedBuildTime("2026-10-16T00:00:00.000Z")
    expect(log).toHaveBeenCalledTimes(2)
  })

  it("warns instead when the moment is in the future", () => {
    const { log, warn } = pinNow()
    reportPinnedBuildTime("2026-12-01T00:00:00.000Z")
    reportPinnedBuildTime("2026-12-01T00:00:00.000Z")
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      "[ardo] Build time pinned to 2026-12-01T00:00:00.000Z (buildTime), which is in the future. Posts scheduled up to that moment are published."
    )
    expect(log).not.toHaveBeenCalled()
  })

  it("reports again after the test reset", () => {
    const { log } = pinNow()
    reportPinnedBuildTime("2026-10-15T00:00:00.000Z")
    resetBuildTimeLogForTests()
    reportPinnedBuildTime("2026-10-15T00:00:00.000Z")
    expect(log).toHaveBeenCalledTimes(2)
  })
})
