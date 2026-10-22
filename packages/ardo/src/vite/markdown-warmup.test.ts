import type { Plugin } from "vite"

import { JsxCompiler } from "ferromark"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  collectFenceLanguages,
  createMarkdownWarmupPlugin,
  warmMarkdownHighlighting,
} from "./markdown-warmup"

let root: string

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "ardo-warmup-"))
  const routes = path.join(root, "app/routes")
  mkdirSync(path.join(routes, "guide"), { recursive: true })
  writeFileSync(
    path.join(routes, "guide/intro.md"),
    '# Intro\n\n```ts\nconst a = 1\n```\n\n```TS title="again"\nconst b = 2\n```\n\n~~~yaml\nkey: value\n~~~\n'
  )
  writeFileSync(path.join(routes, "guide/page.mdx"), "# Page\n\n```json\n{}\n```\n")
  writeFileSync(path.join(routes, "home.tsx"), "export default () => null // ```html\n")
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(root, { recursive: true, force: true })
})

describe("collectFenceLanguages", () => {
  it("lists each language of the Markdown fences once", () => {
    expect(collectFenceLanguages(path.join(root, "app/routes"))).toStrictEqual([
      "json",
      "ts",
      "yaml",
    ])
  })

  it("returns nothing for a missing routes directory", () => {
    expect(collectFenceLanguages(path.join(root, "nowhere"))).toStrictEqual([])
  })
})

describe("warmMarkdownHighlighting", () => {
  it("compiles one small document per language", async () => {
    const prepare = vi.spyOn(JsxCompiler.prototype, "prepare")

    const result = await warmMarkdownHighlighting({
      languages: ["ts", "yaml"],
      markdownConfig: undefined,
    })

    expect(result.languages).toStrictEqual(["ts", "yaml"])
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(prepare).toHaveBeenCalledTimes(2)
  })
})

describe("createMarkdownWarmupPlugin", () => {
  it("warms the languages of the project when the build starts", async () => {
    const prepare = vi.spyOn(JsxCompiler.prototype, "prepare")
    const plugin = createMarkdownWarmupPlugin(undefined, undefined)

    configResolved(plugin, { root })
    await buildStart(plugin)

    expect(prepare).toHaveBeenCalledTimes(3)
  })

  it("warms once for the client and the server build", async () => {
    const prepare = vi.spyOn(JsxCompiler.prototype, "prepare")
    const plugin = createMarkdownWarmupPlugin(undefined, undefined)

    configResolved(plugin, { root })
    await buildStart(plugin)
    await buildStart(plugin)

    expect(prepare).toHaveBeenCalledTimes(3)
  })
})

function noop(): void {
  // The plugin under test defines both hooks; this keeps the helpers total.
}

function configResolved(plugin: Plugin, config: { root: string }): void {
  const hook =
    typeof plugin.configResolved === "function"
      ? plugin.configResolved
      : plugin.configResolved?.handler
  Reflect.apply(hook ?? noop, {}, [config])
}

async function buildStart(plugin: Plugin): Promise<void> {
  const hook =
    typeof plugin.buildStart === "function" ? plugin.buildStart : plugin.buildStart?.handler
  await Reflect.apply(hook ?? noop, {}, [{}])
}
