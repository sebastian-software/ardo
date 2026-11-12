import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  BUILD_CACHE_MAX_AGE_MS,
  buildCacheKey,
  getBuildCache,
  isJsonValue,
  pruneBuildCache,
} from "./build-cache"

const roots: string[] = []
beforeEach(() => {
  vi.stubEnv("ARDO_CACHE", "true")
})
afterEach(() => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

function age(file: string, milliseconds: number): void {
  const time = new Date(Date.now() - milliseconds)
  fs.utimesSync(file, time, time)
}

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

  it("prunes entries no build used within the maximum age", () => {
    const root = project()
    const cache = getBuildCache(root)!
    const directory = path.join(root, "node_modules/.cache/ardo/prune")
    fs.mkdirSync(directory, { recursive: true })
    const stale = path.join(directory, "stale.json")
    const recent = path.join(directory, "recent.json")
    fs.writeFileSync(stale, "{}")
    fs.writeFileSync(recent, "{}")
    age(stale, BUILD_CACHE_MAX_AGE_MS + 60_000)
    age(recent, BUILD_CACHE_MAX_AGE_MS - 60_000)
    cache.write("prune", "current", { ok: true })
    pruneBuildCache(cache)
    expect(fs.existsSync(stale)).toBe(false)
    expect(fs.existsSync(recent)).toBe(true)
    expect(cache.read("prune", "current")).toStrictEqual({ ok: true })
  })

  it("renews an entry's age on every hit", () => {
    const root = project()
    const cache = getBuildCache(root)!
    cache.write("touch", "old", { ok: true })
    const file = path.join(root, "node_modules/.cache/ardo/touch/old.json")
    age(file, BUILD_CACHE_MAX_AGE_MS + 60_000)
    expect(cache.read("touch", "old")).toStrictEqual({ ok: true })
    expect(Date.now() - fs.statSync(file).mtimeMs).toBeLessThan(60_000)
  })

  it("empties namespaces no build used within the maximum age", () => {
    const root = project()
    const stale = path.join(root, "node_modules/.cache/ardo/retired/stale.json")
    fs.mkdirSync(path.dirname(stale), { recursive: true })
    fs.writeFileSync(stale, "{}")
    age(stale, BUILD_CACHE_MAX_AGE_MS + 60_000)
    pruneBuildCache(getBuildCache(root))
    expect(fs.existsSync(stale)).toBe(false)
  })

  it("keeps the entries of other builds in the same project", async () => {
    const root = project()
    // Each import is a fresh module, like a separate `ardo build` process per language variant.
    const variant = async (name: string) => {
      vi.resetModules()
      const module = await import("./build-cache")
      const cache = module.getBuildCache(root)!
      const hits = ["shared", name].filter((key) => cache.read("pages", key) != null)
      cache.write("pages", "shared", { page: "shared" })
      cache.write("pages", name, { page: name })
      module.pruneBuildCache(cache)
      return hits
    }
    expect(await variant("de")).toStrictEqual([])
    expect(await variant("en")).toStrictEqual(["shared"])
    expect(await variant("de")).toStrictEqual(["shared", "de"])
    expect(await variant("en")).toStrictEqual(["shared", "en"])
  })

  it("keeps a build successful when a stale entry cannot be removed", () => {
    const root = project()
    const directory = path.join(root, "node_modules/.cache/ardo/locked")
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, "stale.json"), "{}")
    age(path.join(directory, "stale.json"), BUILD_CACHE_MAX_AGE_MS + 60_000)
    fs.chmodSync(directory, 0o555)
    try {
      expect(() => pruneBuildCache(getBuildCache(root))).not.toThrow()
    } finally {
      fs.chmodSync(directory, 0o755)
    }
  })
})
