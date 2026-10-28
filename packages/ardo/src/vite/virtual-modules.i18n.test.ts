import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { expect, it } from "vitest"

import { resolveConfig } from "../config"
import {
  loadVirtualModule,
  RESOLVED_IDS,
  resolveVirtualModuleId,
  VIRTUAL_SEARCH_ID,
} from "./virtual-modules"

it("emits a distinct lazy search resource for each language and keeps browser records local", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-local-search-"))
  const routesDir = path.join(root, "app/routes")
  try {
    for (const [locale, title] of [
      ["en", "Getting started"],
      ["de", "Erste Schritte"],
    ]) {
      const dir = path.join(routesDir, locale, "guide")
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, "start.mdx"), `---\ntitle: ${title}\n---\n\nInstall Ardo.`)
    }
    const state = {
      routesDir,
      resolvedConfig: resolveConfig(
        { title: "Docs", i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] } },
        root
      ),
    }
    const loaders = await loadVirtualModule("\0virtual:ardo/search-loaders", state)
    expect(loaders).toContain('"de": () => import("virtual:ardo/search-index?locale=de")')
    expect(loaders).toContain('"en": () => import("virtual:ardo/search-index?locale=en")')
    const id = resolveVirtualModuleId(`${VIRTUAL_SEARCH_ID}?locale=de`)
    expect(id).toBe(`${RESOLVED_IDS[VIRTUAL_SEARCH_ID]}?locale=de`)
    const code = await loadVirtualModule(id!, state)
    const records = JSON.parse(code!.slice("export default ".length))
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      path: "/de/guide/start",
      title: "Erste Schritte",
      section: "Guide",
    })
    expect(records[0]).not.toHaveProperty("publicPath")
    expect(code).not.toContain("Getting started")
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
