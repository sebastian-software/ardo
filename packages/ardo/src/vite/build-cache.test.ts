import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { buildCacheKey, getBuildCache, isJsonValue, pruneBuildCache } from "./build-cache"

const roots: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

function project(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-build-cache-"))
  roots.push(root)
  return root
}

describe("persistent build cache", () => {
  it("round-trips JSON results under node_modules/.cache/ardo", () => {
    const root = project()
    const cache = getBuildCache(root)!
    cache.write("example", "key", { title: "Page", headings: [{ level: 2, text: "Intro" }] })
    expect(cache.read("example", "key")).toStrictEqual({
      title: "Page",
      headings: [{ level: 2, text: "Intro" }],
    })
    expect(fs.existsSync(path.join(root, "node_modules/.cache/ardo/example/key.json"))).toBe(true)
    expect(cache.read("example", "missing")).toBeUndefined()
  })

  it("never stores values that JSON would change", () => {
    const cache = getBuildCache(project())!
    cache.write("example", "date", { at: new Date(0) })
    cache.write("example", "nan", { value: Number.NaN })
    expect(cache.read("example", "date")).toBeUndefined()
    expect(cache.read("example", "nan")).toBeUndefined()
    expect(isJsonValue({ list: [1, "two", null, { three: true }] })).toBe(true)
    expect(isJsonValue(Buffer.from("x"))).toBe(false)
  })

  it("treats a torn entry as a miss", () => {
    const root = project()
    const cache = getBuildCache(root)!
    fs.mkdirSync(path.join(root, "node_modules/.cache/ardo/example"), { recursive: true })
    fs.writeFileSync(path.join(root, "node_modules/.cache/ardo/example/torn.json"), '{"half')
    expect(cache.read("example", "torn")).toBeUndefined()
  })

  it("can be turned off with ARDO_CACHE", () => {
    vi.stubEnv("ARDO_CACHE", "false")
    expect(getBuildCache(project())).toBeUndefined()
  })

  it("keys by every part, ignoring object key order and counting function source", () => {
    expect(buildCacheKey("a", { x: 1, y: 2 })).toBe(buildCacheKey("a", { y: 2, x: 1 }))
    expect(buildCacheKey("a", { x: 1 })).not.toBe(buildCacheKey("a", { x: 2 }))
    expect(buildCacheKey({ hook: () => 1 })).not.toBe(buildCacheKey({ hook: () => 2 }))
  })

  it("prunes entries this process did not use", () => {
    const root = project()
    const cache = getBuildCache(root)!
    const stale = path.join(root, "node_modules/.cache/ardo/prune/stale.json")
    fs.mkdirSync(path.dirname(stale), { recursive: true })
    fs.writeFileSync(stale, "{}")
    cache.write("prune", "current", { ok: true })
    pruneBuildCache(cache)
    expect(fs.existsSync(stale)).toBe(false)
    expect(cache.read("prune", "current")).toStrictEqual({ ok: true })
  })
})
