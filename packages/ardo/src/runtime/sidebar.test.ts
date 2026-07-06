import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { generateSidebar } from "./sidebar"

let contentDir: string

beforeEach(async () => {
  contentDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-runtime-sidebar-"))
})

afterEach(async () => {
  await fs.rm(contentDir, { force: true, recursive: true })
})

describe("runtime generateSidebar", () => {
  it("delegates to the Vite sidebar implementation", async () => {
    await writeContent(
      "api/index.mdx",
      `---
title: API
sidebar: leaf
---
`
    )
    await writeContent("api/hidden-child.mdx", "---\ntitle: Hidden Child\n---\n")
    const config = resolveConfig({ title: "Docs" }, contentDir)

    const sidebar = await generateSidebar({
      basePath: "/",
      config,
      contentDir,
    })

    expect(toSerializableSidebar(sidebar)).toStrictEqual([{ text: "API", link: "/api" }])
  })
})

async function writeContent(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(contentDir, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, "utf8")
}

function toSerializableSidebar(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => toSerializableSidebar(item))
  }

  if (value != null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = toSerializableSidebar(item)
      }
    }
    return result
  }

  return value
}
