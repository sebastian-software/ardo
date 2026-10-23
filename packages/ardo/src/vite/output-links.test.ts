import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { checkOutputLinks, formatOutputLinkDiagnostics } from "./output-links"

let clientDir: string

beforeEach(() => {
  clientDir = mkdtempSync(path.join(os.tmpdir(), "ardo-output-links-"))
})

afterEach(() => {
  rmSync(clientDir, { recursive: true, force: true })
})

function write(file: string, content = "") {
  const target = path.join(clientDir, file)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, content)
}

function page(body: string, head = "") {
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`
}

const hrefs = (result: Awaited<ReturnType<typeof checkOutputLinks>>) =>
  result.diagnostics.map(({ file, href }) => `${file} ${href}`)

describe("checkOutputLinks", () => {
  it("accepts pages, trailing-slash variants, relative links, and assets", async () => {
    write(
      "index.html",
      page(
        '<a href="/guide/">Guide</a><a href="/guide">Guide</a><a href="guide/intro/">Intro</a>',
        '<link rel="stylesheet" href="/assets/app.css"><script src="/assets/app.js"></script>'
      )
    )
    write("guide/index.html", page('<a href="intro/">Intro</a><a href="../">Home</a>'))
    write("guide/intro/index.html", page('<img src="../../logo.svg" srcset="/logo.svg 2x">'))
    write("assets/app.css")
    write("assets/app.js")
    write("logo.svg")

    const result = await checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics).toStrictEqual([])
    expect(result.pages).toBe(3)
    expect(result.links).toBe(9)
  })

  it("reports every missing page and asset with its line", async () => {
    write(
      "index.html",
      page('<a href="/missing/">A</a>\n<a href="/missing/">B</a>\n<img src="/assets/gone.png">')
    )

    const result = await checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics).toStrictEqual([
      { file: "index.html", line: 1, href: "/missing/", message: "Missing target" },
      { file: "index.html", line: 2, href: "/missing/", message: "Missing target" },
      { file: "index.html", line: 3, href: "/assets/gone.png", message: "Missing target" },
    ])
  })

  it("checks anchors on the same and on other pages", async () => {
    write(
      "index.html",
      page(
        '<h2 id="intro">Intro</h2><a name="legacy"></a>' +
          '<a href="#intro">ok</a><a href="#legacy">ok</a><a href="#top">ok</a>' +
          '<a href="#nope">bad</a><a href="/guide/#setup">ok</a><a href="/guide/#gone">bad</a>'
      )
    )
    write("guide/index.html", page('<h2 id="setup">Setup</h2>'))

    const result = await checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics.map(({ href, message }) => `${href} ${message}`)).toStrictEqual([
      '#nope Missing anchor "#nope"',
      '/guide/#gone Missing anchor "#gone"',
    ])
    const withoutAnchors = await checkOutputLinks({ clientDir, base: "/", checkAnchors: false })
    expect(withoutAnchors.diagnostics).toStrictEqual([])
  })

  it("decodes encoded paths and fragments", async () => {
    write("index.html", page('<a href="/caf%C3%A9/#d%C3%A9j%C3%A0">ok</a>'))
    write("café/index.html", page('<h2 id="déjà">Déjà</h2>'))

    const result = await checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics).toStrictEqual([])
  })

  it("ignores external links and resource hints but checks the site's own origin", async () => {
    write(
      "index.html",
      page(
        '<a href="https://example.com/missing">x</a><a href="mailto:a@b.c">m</a>' +
          '<a href="javascript:void 0">j</a><a href="https://docs.example.org/gone/">own</a>',
        '<link rel="preconnect" href="/nowhere"><link rel="canonical" href="https://docs.example.org/">'
      )
    )

    const result = await checkOutputLinks({
      clientDir,
      base: "/",
      siteUrl: "https://docs.example.org",
    })

    expect(hrefs(result)).toStrictEqual(["index.html https://docs.example.org/gone/"])
  })

  it("resolves a versioned build that keeps its base folder", async () => {
    write("v2/index.html", page('<a href="/v2/guide/">ok</a><a href="/v2/gone/">bad</a>'))
    write("v2/guide/index.html", page('<a href="/v1/guide/">older version</a><a href="../">up</a>'))
    write("__spa-fallback.html", page('<script src="/v2/assets/app.js"></script>'))
    write("v2/assets/app.js")

    const archived = await checkOutputLinks({ clientDir, base: "/v2/", externalPaths: ["/v1/"] })
    expect(hrefs(archived)).toStrictEqual(["v2/index.html /v2/gone/"])

    // Without the archived version, its links are as broken as any other.
    const unknown = await checkOutputLinks({ clientDir, base: "/v2/" })
    expect(hrefs(unknown)).toStrictEqual([
      "v2/guide/index.html /v1/guide/",
      "v2/index.html /v2/gone/",
    ])
  })

  it("resolves a flattened build whose files sit at the root of the base", async () => {
    write("index.html", page('<a href="/docs/guide/">ok</a><a href="/docs/gone/">bad</a>'))
    write("guide/index.html", page('<a href="/docs/">home</a><a href="/docs">home</a>'))

    const result = await checkOutputLinks({ clientDir, base: "/docs/" })

    expect(hrefs(result)).toStrictEqual(["index.html /docs/gone/"])
  })

  it.each(["/", "/project/"])(
    "checks versioned localized output mounted at %s without a version index",
    async (deploymentBase) => {
      const base = `${deploymentBase}v6/`
      write(
        "v6/en/index.html",
        page(
          `<a href="${base}en/guide/">Guide</a><a href="${base}en/missing/">Missing</a>`,
          `<script src="${base}assets/app.js"></script>`
        )
      )
      write("v6/en/guide/index.html", page(`<a href="${base}en/">Home</a>`))
      write("v6/assets/app.js")

      const result = await checkOutputLinks({ clientDir, base, deploymentBase })

      expect(hrefs(result)).toStrictEqual([`v6/en/index.html ${base}en/missing/`])
    }
  )

  it("reports links that leave the deployment base", async () => {
    write("v6/index.html", page('<a href="/guide/">forgot the prefix</a>'))

    const result = await checkOutputLinks({
      clientDir,
      base: "/project/v6/",
      deploymentBase: "/project/",
    })

    expect(result.diagnostics).toStrictEqual([
      {
        file: "v6/index.html",
        line: 1,
        href: "/guide/",
        message: "Outside the deployment base /project/",
      },
    ])
  })

  it("accepts redirect pages and excluded patterns with or without the base", async () => {
    // Ardo writes an HTML page for every redirect source, next to `_redirects`.
    write("_redirects", "/v2/old /v2/guide/ 301\n")
    write("v2/old/index.html", page('<meta http-equiv="refresh" content="0; url=/v2/guide/">'))
    write("v2/guide/index.html", page("Guide"))
    write(
      "v2/index.html",
      page(
        '<a href="/v2/old/">moved</a><a href="/v2/storybook/">sb</a><a href="/v2/generated/x">gen</a>'
      )
    )

    const result = await checkOutputLinks({
      clientDir,
      base: "/v2/",
      exclude: ["/storybook/", "/v2/generated/*"],
    })

    expect(result.diagnostics).toStrictEqual([])
  })

  it("checks the destinations in redirect and version files", async () => {
    write("index.html", page("Home"))
    write("_redirects", "/old /\n/older /gone/ 301\n")
    write("versions.json", '{ "current": "v2", "versions": [{ "id": "v1", "path": "/v1/" }] }\n')

    const result = await checkOutputLinks({ clientDir, base: "/" })
    expect(hrefs(result)).toStrictEqual(["_redirects /gone/", "versions.json /v1/"])

    const archived = await checkOutputLinks({ clientDir, base: "/", externalPaths: ["/v1/"] })
    expect(hrefs(archived)).toStrictEqual(["_redirects /gone/"])
  })

  it("formats diagnostics grouped by page", () => {
    expect(
      formatOutputLinkDiagnostics([
        { file: "a/index.html", line: 3, href: "/x", message: "Missing target" },
        { file: "a/index.html", line: 7, href: "#y", message: 'Missing anchor "#y"' },
        { file: "b.json", line: 0, href: "/z", message: "Missing target" },
      ])
    ).toBe(
      [
        "  a/index.html",
        "    /x (line 3): Missing target",
        '    #y (line 7): Missing anchor "#y"',
        "  b.json",
        "    /z: Missing target",
      ].join("\n")
    )
  })
})
