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

const hrefs = (result: ReturnType<typeof checkOutputLinks>) =>
  result.diagnostics.map(({ file, href }) => `${file} ${href}`)

describe("checkOutputLinks", () => {
  it("accepts pages, trailing-slash variants, relative links, and assets", () => {
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

    const result = checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics).toStrictEqual([])
    expect(result.pages).toBe(3)
    expect(result.links).toBe(9)
  })

  it("reports missing pages and assets once per page", () => {
    write(
      "index.html",
      page('<a href="/missing/">A</a><a href="/missing/">B</a><img src="/assets/gone.png">')
    )

    const result = checkOutputLinks({ clientDir, base: "/" })

    expect(hrefs(result)).toStrictEqual(["index.html /missing/", "index.html /assets/gone.png"])
    expect(result.diagnostics[0].message).toBe("Missing target")
  })

  it("checks anchors on the same and on other pages", () => {
    write(
      "index.html",
      page(
        '<h2 id="intro">Intro</h2><a name="legacy"></a>' +
          '<a href="#intro">ok</a><a href="#legacy">ok</a><a href="#top">ok</a>' +
          '<a href="#nope">bad</a><a href="/guide/#setup">ok</a><a href="/guide/#gone">bad</a>'
      )
    )
    write("guide/index.html", page('<h2 id="setup">Setup</h2>'))

    const result = checkOutputLinks({ clientDir, base: "/" })

    expect(result.diagnostics.map(({ href, message }) => `${href} ${message}`)).toStrictEqual([
      '#nope Missing anchor "#nope"',
      '/guide/#gone Missing anchor "#gone"',
    ])
    expect(
      checkOutputLinks({ clientDir, base: "/", checkAnchors: false }).diagnostics
    ).toStrictEqual([])
  })

  it("decodes encoded paths and fragments", () => {
    write("index.html", page('<a href="/caf%C3%A9/#d%C3%A9j%C3%A0">ok</a>'))
    write("café/index.html", page('<h2 id="déjà">Déjà</h2>'))

    expect(checkOutputLinks({ clientDir, base: "/" }).diagnostics).toStrictEqual([])
  })

  it("ignores external links and resource hints but checks the site's own origin", () => {
    write(
      "index.html",
      page(
        '<a href="https://example.com/missing">x</a><a href="mailto:a@b.c">m</a>' +
          '<a href="javascript:void 0">j</a><a href="https://docs.example.org/gone/">own</a>',
        '<link rel="preconnect" href="/nowhere"><link rel="canonical" href="https://docs.example.org/">'
      )
    )

    const result = checkOutputLinks({ clientDir, base: "/", siteUrl: "https://docs.example.org" })

    expect(hrefs(result)).toStrictEqual(["index.html https://docs.example.org/gone/"])
  })

  it("resolves a versioned build that keeps its base folder", () => {
    write("v2/index.html", page('<a href="/v2/guide/">ok</a><a href="/v2/gone/">bad</a>'))
    write("v2/guide/index.html", page('<a href="/v1/guide/">older version</a><a href="../">up</a>'))
    write("__spa-fallback.html", page('<script src="/v2/assets/app.js"></script>'))
    write("v2/assets/app.js")

    const result = checkOutputLinks({ clientDir, base: "/v2/" })

    expect(hrefs(result)).toStrictEqual(["v2/index.html /v2/gone/"])
  })

  it("resolves a flattened build whose files sit at the root of the base", () => {
    write("index.html", page('<a href="/docs/guide/">ok</a><a href="/docs/gone/">bad</a>'))
    write("guide/index.html", page('<a href="/docs/">home</a><a href="/docs">home</a>'))

    const result = checkOutputLinks({ clientDir, base: "/docs/" })

    expect(hrefs(result)).toStrictEqual(["index.html /docs/gone/"])
  })

  it("accepts redirect sources and excluded patterns with or without the base", () => {
    write("_redirects", "# moved pages\n/v2/old /v2/guide/ 301\n")
    write(
      "v2/index.html",
      page(
        '<a href="/v2/old/">moved</a><a href="/v2/storybook/">sb</a><a href="/v2/generated/x">gen</a>'
      )
    )

    const result = checkOutputLinks({
      clientDir,
      base: "/v2/",
      exclude: ["/storybook/", "/v2/generated/*"],
    })

    expect(result.diagnostics).toStrictEqual([])
  })

  it("formats diagnostics grouped by page", () => {
    expect(
      formatOutputLinkDiagnostics([
        { file: "a/index.html", href: "/x", message: "Missing target" },
        { file: "a/index.html", href: "#y", message: 'Missing anchor "#y"' },
        { file: "b.html", href: "/z", message: "Missing target" },
      ])
    ).toBe(
      [
        "  a/index.html",
        "    /x: Missing target",
        '    #y: Missing anchor "#y"',
        "  b.html",
        "    /z: Missing target",
      ].join("\n")
    )
  })
})
