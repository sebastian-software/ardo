import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { ardo } from "ardo/vite"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const appRequire = createRequire(import.meta.url)
const ardoRequire = createRequire(appRequire.resolve("ardo/package.json"))
const { build, createServer } = ardoRequire("vite")

let parent: string
let root: string

function writePackage(relative: string, manifest: object, source = "export const value = 1") {
  const directory = path.join(parent, relative)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({ type: "module", exports: "./index.js", ...manifest })
  )
  writeFileSync(path.join(directory, "index.js"), source)
  return directory
}

function config() {
  const boundary = ardo({ routes: false, icons: false }).find(
    (plugin) => plugin.name === "ardo:project-boundary"
  )
  if (boundary == null) throw new Error("Ardo package boundary is unavailable")
  return {
    root,
    configFile: false,
    plugins: [boundary],
    logLevel: "silent",
    ssr: { noExternal: true },
    build: { ssr: path.join(root, "entry.mjs"), outDir: "build", minify: false },
  }
}

beforeEach(() => {
  parent = mkdtempSync(path.join(os.tmpdir(), "ardo-import-boundary-"))
  root = writePackage("docs", {})
})

afterEach(() => rmSync(parent, { recursive: true, force: true }))

describe("Ardo documentation import boundary", () => {
  it("rejects root-only imports that Vite would otherwise bundle", async () => {
    writePackage("node_modules/dependency", { name: "dependency" })
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "dependency";')
    const before = config()
    await build({ ...before, plugins: [], build: { ...before.build, outDir: "before" } })
    const result = await import(pathToFileURL(path.join(root, "before/entry.js")).href)
    expect(result.value).toBe(1)
    await expect(build(config())).rejects.toThrow(/Undeclared dependency "dependency"/u)
  })

  it.each(["react", "dependency"])(
    "rejects an SSR external borrowing ancestor %s",
    async (name) => {
      writePackage(`node_modules/${name}`, { name })
      writeFileSync(path.join(root, "entry.mjs"), `export { value } from ${JSON.stringify(name)};`)
      const external = { ...config(), ssr: { noExternal: true as const, external: [name] } }
      await build({ ...external, plugins: [], build: { ...external.build, outDir: "before" } })
      const result = await import(pathToFileURL(path.join(root, "before/entry.js")).href)
      expect(result.value).toBe(1)
      const expectedError =
        name === "react"
          ? /Framework-managed package "react" cannot remain external/u
          : /Undeclared dependency/u
      await expect(build(external)).rejects.toThrow(expectedError)
    }
  )

  it("rejects an ancestor installation even when the docs manifest declares it", async () => {
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage("node_modules/dependency", { name: "dependency" })
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "dependency";')
    await expect(build(config())).rejects.toThrow(/not installed.*docs\/node_modules/u)
  })

  it("rejects sibling components in both builds and development", async () => {
    writePackage("components", { name: "components" })
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "../components/index.js";')
    await expect(build(config())).rejects.toThrow(/Import outside the documentation package/u)
    const server = await createServer({
      ...config(),
      server: { middlewareMode: true, watch: null },
    })
    try {
      await expect(server.transformRequest("/entry.mjs")).rejects.toThrow(
        /Import outside the documentation package/u
      )
    } finally {
      await server.close()
    }
  })

  it("rejects an external file URL pointing at sibling component source", async () => {
    const outside = writePackage("components", { name: "components" })
    const url = pathToFileURL(path.join(outside, "index.js")).href
    writeFileSync(path.join(root, "entry.mjs"), `export { value } from ${JSON.stringify(url)};`)
    await expect(build(config())).rejects.toThrow(/Import outside the documentation package/u)
  })

  it("rejects a Vite alias pointing at sibling component source", async () => {
    const outside = writePackage("components", { name: "components" })
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "component";')
    await expect(
      build({ ...config(), resolve: { alias: { component: path.join(outside, "index.js") } } })
    ).rejects.toThrow(/Import outside the documentation package/u)
  })

  it("does not borrow an optional dependency when an unused feature references it", async () => {
    writePackage("node_modules/optional", { name: "optional" }, "export const value = 99")
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage(
      "docs/node_modules/dependency",
      {
        name: "dependency",
        peerDependencies: { optional: "1" },
        peerDependenciesMeta: { optional: { optional: true } },
      },
      'export async function optionalValue() { const { value } = await import("optional"); return value; }'
    )
    writeFileSync(path.join(root, "entry.mjs"), 'export { optionalValue } from "dependency";')
    await build(config())
    const result = await import(pathToFileURL(path.join(root, "build/entry.js")).href)
    await expect(result.optionalValue()).rejects.toThrow(
      /Optional dependency "optional" is not installed/u
    )
  })

  it("rejects an alias importing a transitive package directly into the app", async () => {
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage("docs/node_modules/dependency", {
      name: "dependency",
      dependencies: { nested: "1" },
    })
    const nested = writePackage("docs/node_modules/nested", { name: "nested" })
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "component";')
    await expect(
      build({ ...config(), resolve: { alias: { component: path.join(nested, "index.js") } } })
    ).rejects.toThrow(/Undeclared application dependency/u)
  })

  it("bundles a declared dependency and its transitive pnpm store dependencies", async () => {
    const dependency = writePackage(
      "node_modules/.pnpm/dependency/node_modules/dependency",
      { name: "dependency", dependencies: { nested: "1" } },
      'export { value } from "nested";'
    )
    writePackage("node_modules/.pnpm/dependency/node_modules/nested", { name: "nested" })
    writePackage("node_modules/nested", { name: "nested" }, "export const value = 99")
    writePackage("docs", { dependencies: { dependency: "1" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(dependency, path.join(root, "node_modules/dependency"), "dir")
    writeFileSync(path.join(root, "entry.mjs"), 'export { value } from "dependency";')
    await build({ ...config(), ssr: { noExternal: true, external: ["fs", "node:fs"] } })
    const result = await import(pathToFileURL(path.join(root, "build/entry.js")).href)
    expect(result.value).toBe(1)
  })
})
