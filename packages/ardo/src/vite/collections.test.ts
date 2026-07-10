import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createCollectionContentSources, readCollections } from "./collections"

let tempDir: string

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-collections-"))
})

afterEach(async () => {
  await fs.rm(tempDir, { force: true, recursive: true })
})

describe("collections", () => {
  it("reads typed local Markdown data and materializes the same source into routes", async () => {
    await fs.mkdir(path.join(tempDir, "recipes"))
    await fs.writeFile(
      path.join(tempDir, "recipes", "quickstart.md"),
      "---\ntitle: Quickstart\n---\n# Quickstart\n"
    )

    const collections = {
      recipes: {
        from: "recipes",
        schema: (data: Record<string, unknown>) => ({ title: String(data.title) }),
        to: "recipes",
      },
    }

    await expect(readCollections({ collections, root: tempDir })).resolves.toStrictEqual({
      recipes: [
        {
          data: { title: "Quickstart" },
          sourcePath: path.join(tempDir, "recipes", "quickstart.md"),
        },
      ],
    })
    expect(createCollectionContentSources(collections)).toStrictEqual([
      { from: "recipes", to: "recipes" },
    ])
  })
})
