import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createLogger } from "vite"

import { findNotFoundPage } from "./preview-static"
import { createAssetResolver, prerenderSite, resolvePageDirectory, toHtmlFile } from "./static-site"
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

describe("prerender response status", () => {
  let directory: string

  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  function render(status: number) {
    directory = mkdtempSync(path.join(os.tmpdir(), "ardo-prerender-status-"))
    mkdirSync(path.join(directory, ".vite"))
    writeFileSync(
      path.join(directory, ".vite/manifest.json"),
      JSON.stringify({
        "entry-client": { file: "assets/client.js", isEntry: true },
      })
    )
    const serverEntry = path.join(directory, "server.mjs")
    writeFileSync(
      serverEntry,
      `
      export function getStaticPaths() { return ["/guide"]; }
      export async function renderPage(page, options) {
        return { html: options.notFound ? "Intentional not found" : "Guide content", status: options.notFound ? 404 : ${status} };
      }
    `
    )
    return prerenderSite({
      base: "/",
      deploymentBase: "/",
      clientDir: directory,
      logger: createLogger("silent"),
      serverEntry,
    })
  }

  it.each([301, 404, 500])(
    "rejects HTTP %i for an authored route before writing its HTML",
    async (status) => {
      await expect(render(status)).rejects.toThrow(
        `[ardo] Could not prerender "/guide": renderer returned HTTP ${status}.`
      )
      expect(existsSync(path.join(directory, "guide/index.html"))).toBe(false)
    }
  )

  it("writes successful pages and the intentional 404 artifact", async () => {
    await expect(render(200)).resolves.toBe(1)
    expect(readFileSync(path.join(directory, "guide/index.html"), "utf8")).toBe("Guide content")
    expect(readFileSync(path.join(directory, "404.html"), "utf8")).toBe("Intentional not found")
  })
})
