import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { scanRouteManifest } from "./route-manifest"

let tempDir: string

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-manifest-"))
})

afterEach(async () => {
  await fs.rm(tempDir, { force: true, recursive: true })
})

describe("route-manifest", () => {
  it("extracts unicode and deduplicated heading anchors", async () => {
    await fs.writeFile(
      path.join(tempDir, "guide.mdx"),
      [
        "# Guide",
        "```md",
        "# Ignored",
        "```",
        "## Über uns",
        "~~~md",
        "## Also ignored",
        "~~~",
        "## Über uns",
        "## `API` & Usage",
      ].join("\n"),
      "utf8"
    )

    const [entry] = await scanRouteManifest(tempDir)

    expect(entry.anchors).toStrictEqual(["guide", "über-uns", "über-uns-1", "api-usage"])
  })

  it("extracts route metadata, anchors, redirects, and dynamic paths", async () => {
    const guideDir = path.join(tempDir, "guide")
    await fs.mkdir(guideDir, { recursive: true })
    await fs.writeFile(
      path.join(guideDir, "$slug.mdx"),
      `---
title: Café Guide
description: Accent-aware page
collapsed: true
redirectFrom:
  - /old-guide
  - 123
---

## Café <span>Déjà</span> vu!
`,
      "utf8"
    )
    await fs.writeFile(path.join(tempDir, "root.tsx"), "export default function Root() {}", "utf8")

    const entries = await scanRouteManifest(tempDir)

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      anchors: ["café-déjà-vu"],
      frontmatter: {
        collapsed: true,
        description: "Accent-aware page",
        redirectFrom: ["/old-guide"],
        title: "Café Guide",
      },
      metadata: {
        collapsed: true,
      },
      identity: {
        publicPath: "/guide/:slug",
        routePath: "/guide/:slug",
      },
      path: "/guide/:slug",
      publicPath: "/guide/:slug",
      routePath: "/guide/:slug",
      source: "markdown",
    })
  })

  it("can build versioned and localized public paths without changing route paths", async () => {
    await fs.writeFile(path.join(tempDir, "guide.mdx"), "# Guide", "utf8")

    const [entry] = await scanRouteManifest(tempDir, {
      basePath: "/v3/",
      localeId: "en",
      versionId: "v3",
    })

    expect(entry).toMatchObject({
      identity: {
        localeId: "en",
        publicPath: "/v3/en/guide",
        routePath: "/guide",
        versionId: "v3",
      },
      metadata: {
        localeId: "en",
        publicPath: "/v3/en/guide",
        routePath: "/guide",
        sourcePath: "guide.mdx",
        versionId: "v3",
      },
      path: "/guide",
      publicPath: "/v3/en/guide",
      routePath: "/guide",
    })
  })

  it("keeps file-specific frontmatter diagnostics beside normalized metadata", async () => {
    await fs.writeFile(
      path.join(tempDir, "guide.mdx"),
      `---
order: first
titlle: Misspelled
title: Guide
---

# Guide
`,
      "utf8"
    )

    const [entry] = await scanRouteManifest(tempDir)

    expect(entry.metadata.title).toBe("Guide")
    expect(entry.frontmatterDiagnostics).toStrictEqual([
      {
        field: "order",
        kind: "invalid",
        message: 'Invalid value for frontmatter field "order".',
      },
      {
        field: "titlle",
        kind: "unknown",
        message: 'Unsupported frontmatter field "titlle".',
      },
    ])
  })

  it("reads locale directory names into metadata without making them part of the logical route", async () => {
    await fs.mkdir(path.join(tempDir, "de", "guide"), { recursive: true })
    await fs.writeFile(path.join(tempDir, "de", "guide", "start.mdx"), "# Start", "utf8")

    const [entry] = await scanRouteManifest(tempDir, {
      basePath: "/v3/",
      localeIds: ["en", "de"],
    })

    expect(entry).toMatchObject({
      metadata: { localeId: "de", publicPath: "/v3/de/guide/start", routePath: "/guide/start" },
      routePath: "/guide/start",
    })
  })
})
