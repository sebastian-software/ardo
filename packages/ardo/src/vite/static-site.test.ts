import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { findNotFoundPage } from "./preview-static"
import { createAssetResolver, resolvePageDirectory, toHtmlFile } from "./static-site"
import { toPagePath } from "./dev-render"

describe("createAssetResolver", () => {
  const manifest = {
    "virtual:ardo/entry-client": {
      file: "assets/entry-client.js",
      css: ["assets/entry-client.css"],
      imports: ["_shared.js"],
      isEntry: true,
    },
    "_shared.js": { file: "assets/shared.js" },
    "app/routes/guide.mdx": {
      file: "assets/guide.js",
      css: ["assets/guide.css"],
      imports: ["_shared.js", "_doc.js"],
      isDynamicEntry: true,
    },
    "_doc.js": { file: "assets/doc.js", css: ["assets/doc.css"] },
  }

  it("collects the entry, the route chunk, and their stylesheets once", () => {
    const assets = createAssetResolver(manifest, "/v6/")

    expect(assets("app/routes/guide.mdx")).toStrictEqual({
      entry: "/v6/assets/entry-client.js",
      modulePreloads: ["/v6/assets/shared.js", "/v6/assets/guide.js", "/v6/assets/doc.js"],
      stylesheets: ["/v6/assets/entry-client.css", "/v6/assets/guide.css", "/v6/assets/doc.css"],
    })
    expect(assets(undefined).stylesheets).toStrictEqual(["/v6/assets/entry-client.css"])
  })

  it("rejects a client build without an entry", () => {
    expect(() => createAssetResolver({}, "/")).toThrow("no entry chunk")
  })
})

describe("output layout", () => {
  it("places versioned pages below the deployment root", () => {
    expect(resolvePageDirectory("/out", "/v6/", "/")).toBe(path.join("/out", "v6"))
    expect(resolvePageDirectory("/out", "/repo/v6/", "/repo/")).toBe(path.join("/out", "v6"))
    expect(resolvePageDirectory("/out", "/repo/", "/repo/")).toBe("/out")
  })

  it("writes each page as a folder index", () => {
    expect(toHtmlFile("/")).toBe("index.html")
    expect(toHtmlFile("/guide/intro")).toBe("guide/intro/index.html")
    expect(toHtmlFile("/guide/intro/")).toBe("guide/intro/index.html")
  })
})

function request(url: string, accept = "text/html", method = "GET") {
  return {
    headers: { accept },
    method,
    originalUrl: url,
    url,
  }
}

describe("dev page requests", () => {
  it.each([
    ["/", "/", "/"],
    ["/guide/intro", "/", "/guide/intro"],
    ["/guide/intro/", "/", "/guide/intro/"],
    ["/v6", "/v6/", "/"],
    ["/v6/guide/", "/v6/", "/guide/"],
    ["/v6/index.html", "/v6/", "/"],
    ["/caf%C3%A9", "/", "/café"],
  ])("maps %s with base %s to the page %s", (url, base, page) => {
    expect(toPagePath(request(url), base)).toBe(page)
  })

  it.each([
    ["/assets/app.js", "/"],
    ["/@vite/client", "/"],
    ["/__ardo", "/"],
    ["/other/page", "/v6/"],
  ])("leaves %s with base %s to Vite", (url, base) => {
    expect(toPagePath(request(url), base)).toBeUndefined()
  })

  it("only answers HTML reads", () => {
    expect(toPagePath(request("/guide", "application/json"), "/")).toBeUndefined()
    expect(toPagePath(request("/guide", "text/html", "POST"), "/")).toBeUndefined()
    expect(toPagePath(request("/guide", "*/*"), "/")).toBe("/guide")
  })
})

describe("preview 404 pages", () => {
  let outDir: string | undefined

  afterEach(() => {
    if (outDir != null) rmSync(outDir, { recursive: true, force: true })
  })

  it("serves the closest 404 page", () => {
    outDir = mkdtempSync(path.join(os.tmpdir(), "ardo-preview-"))
    mkdirSync(path.join(outDir, "v6"), { recursive: true })
    writeFileSync(path.join(outDir, "v6/404.html"), "missing")

    expect(findNotFoundPage(outDir, "v6/guide/missing")).toBe(path.join(outDir, "v6/404.html"))
    expect(findNotFoundPage(outDir, "other/missing")).toBeUndefined()
  })
})
