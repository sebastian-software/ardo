import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { generateContextSidebars, generateSidebar } from "./sidebar-index"

let routesDir: string

beforeEach(async () => {
  routesDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-sidebar-"))
})

afterEach(async () => {
  await fs.rm(routesDir, { force: true, recursive: true })
})

describe("generateSidebar", () => {
  it("keeps the default generated order when no section order is configured", async () => {
    await writeRoute(
      "guide/second.mdx",
      `---
title: Second
order: 2
---
`
    )
    await writeRoute(
      "guide/first.mdx",
      `---
title: First
order: 1
---
`
    )
    await writeRoute("architecture/overview.mdx", "---\ntitle: Overview\n---\n")
    await writeRoute("reference/api.mdx", "---\ntitle: API\n---\n")

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "Architecture",
        items: [{ text: "Overview", link: "/architecture/overview" }],
      },
      {
        text: "Guide",
        items: [
          { text: "First", link: "/guide/first" },
          { text: "Second", link: "/guide/second" },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "API", link: "/reference/api" }],
      },
    ])
  })

  it("prioritizes configured top-level sections and appends unlisted sections", async () => {
    await writeRoute("architecture/overview.mdx", "---\ntitle: Overview\n---\n")
    await writeRoute("archive/old.mdx", "---\ntitle: Old\n---\n")
    await writeRoute("guide/zeta.mdx", "---\ntitle: Zeta\n---\n")
    await writeRoute("guide/alpha.mdx", "---\ntitle: Alpha\n---\n")
    await writeRoute("quality/checks.mdx", "---\ntitle: Checks\n---\n")
    await writeRoute("reference/api.mdx", "---\ntitle: API\n---\n")

    const sidebar = await generateSidebar(routesDir, {
      sectionOrder: ["guide", "reference", "quality", "architecture"],
    })

    expect(toVirtualSidebar(sidebar)).toStrictEqual([
      {
        text: "Guide",
        items: [
          { text: "Alpha", link: "/guide/alpha" },
          { text: "Zeta", link: "/guide/zeta" },
        ],
      },
      {
        text: "Reference",
        items: [{ text: "API", link: "/reference/api" }],
      },
      {
        text: "Quality",
        items: [{ text: "Checks", link: "/quality/checks" }],
      },
      {
        text: "Architecture",
        items: [{ text: "Overview", link: "/architecture/overview" }],
      },
      {
        text: "Archive",
        items: [{ text: "Old", link: "/archive/old" }],
      },
    ])
  })

  it("uses directory index frontmatter for generated directory nodes", async () => {
    await writeRoute(
      "guide/index.mdx",
      `---
title: Guidebook
order: 20
collapsed: true
---
`
    )
    await writeRoute("guide/intro.mdx", "---\ntitle: Intro\n---\n")
    await writeRoute(
      "reference/index.md",
      `---
title: Reference API
order: 10
collapsed: false
---
`
    )
    await writeRoute("reference/api.mdx", "---\ntitle: API\n---\n")
    await writeRoute("archive/old.mdx", "---\ntitle: Old\n---\n")

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "Reference API",
        link: "/reference",
        collapsed: false,
        items: [{ text: "API", link: "/reference/api" }],
      },
      {
        text: "Guidebook",
        link: "/guide",
        collapsed: true,
        items: [{ text: "Intro", link: "/guide/intro" }],
      },
      {
        text: "Archive",
        items: [{ text: "Old", link: "/archive/old" }],
      },
    ])
  })

  it("omits leaf markdown routes with sidebar false", async () => {
    await writeRoute("guide/visible.mdx", "---\ntitle: Visible\n---\n")
    await writeRoute(
      "guide/hidden.mdx",
      `---
title: Hidden
sidebar: false
---
`
    )
    await writeRoute(
      "private/hidden.mdx",
      `---
title: Hidden
sidebar: false
---
`
    )

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "Guide",
        items: [{ text: "Visible", link: "/guide/visible" }],
      },
    ])
  })

  it("skips malformed leaf frontmatter without dropping the rest of the sidebar", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    await writeRoute("guide/visible.mdx", "---\ntitle: Visible\n---\n")
    await writeRoute("guide/broken.mdx", "---\n: bad\n---\n")

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "Guide",
        items: [{ text: "Visible", link: "/guide/visible" }],
      },
    ])
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(path.join(routesDir, "guide", "broken.mdx"))
    )
    warn.mockRestore()
  })

  it("keeps child pages when directory index metadata is malformed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    await writeRoute("guide/index.mdx", "---\n: bad\n---\n")
    await writeRoute("guide/intro.mdx", "---\ntitle: Intro\n---\n")

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "Guide",
        link: "/guide",
        items: [{ text: "Intro", link: "/guide/intro" }],
      },
    ])
    warn.mockRestore()
  })

  it("groups sidebars by top-level folder for context-driven sites", async () => {
    await writeRoute("guide/getting-started.mdx", "---\ntitle: Getting Started\n---\n")
    await writeRoute("guide/advanced.mdx", "---\ntitle: Advanced\n---\n")
    await writeRoute(
      "api-reference/components/index.md",
      "---\ntitle: Components\nsidebar: leaf\n---\n"
    )
    await writeRoute("api-reference/components/foo.md", "---\ntitle: Foo\n---\n")
    await writeRoute("home.tsx", "// not a markdown file, ignored\n")

    expect(toVirtualSidebar(await generateContextSidebars(routesDir))).toStrictEqual({
      guide: [
        { text: "Advanced", link: "/guide/advanced" },
        { text: "Getting Started", link: "/guide/getting-started" },
      ],
      "api-reference": [{ text: "Components", link: "/api-reference/components" }],
    })
  })

  it("renders a folder as a leaf link when its index sets sidebar: leaf", async () => {
    await writeRoute(
      "api/index.md",
      `---
title: API Reference
sidebar: leaf
---
`
    )
    await writeRoute("api/foo.md", "---\ntitle: Foo\n---\n")
    await writeRoute("api/bar.md", "---\ntitle: Bar\n---\n")
    await writeRoute("guide/intro.mdx", "---\ntitle: Intro\n---\n")

    expect(toVirtualSidebar(await generateSidebar(routesDir))).toStrictEqual([
      {
        text: "API Reference",
        link: "/api",
      },
      {
        text: "Guide",
        items: [{ text: "Intro", link: "/guide/intro" }],
      },
    ])
  })
})

async function writeRoute(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(routesDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}

function toVirtualSidebar(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => toVirtualSidebar(item))
  }

  if (value != null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = toVirtualSidebar(item)
      }
    }
    return result
  }

  return value
}
