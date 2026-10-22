import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const script = fileURLToPath(new URL("prepare-pages-artifact.mjs", import.meta.url))
let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "ardo-pages-"))
  await mkdir(path.join(root, "client"), { recursive: true })
  await mkdir(path.join(root, "snapshots"), { recursive: true })
  await writeManifest()
  await writePage("client/v5", "current docs")
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

function prepare(overrides: Record<string, string> = {}) {
  return execFileSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ARDO_PAGES_CLIENT_DIR: "client",
      ARDO_PAGES_ARTIFACT_DIR: "pages",
      ARDO_PAGES_VERSION_SNAPSHOTS_DIR: "snapshots",
      ...overrides,
    },
  })
}

async function writeManifest(
  value: unknown = {
    current: "v5",
    versions: [
      { id: "v5", path: "/v5/" },
      { id: "v4", path: "/v4/" },
    ],
  }
) {
  await writeFile(path.join(root, "client/versions.json"), JSON.stringify(value))
}

async function writePage(relative: string, content: string) {
  await mkdir(path.join(root, relative), { recursive: true })
  await writeFile(path.join(root, relative, "index.html"), content)
}

async function archive(folder = "v4") {
  const archivePath = path.join(root, "snapshots/v4.tar.gz")
  execFileSync("tar", ["-czf", archivePath, "-C", path.join(root, "source"), folder])
  const sha256 = createHash("sha256")
    .update(await readFile(archivePath))
    .digest("hex")
  await writeFile(path.join(root, "snapshots/snapshots.json"), JSON.stringify({ v4: { sha256 } }))
}

describe("GitHub Pages artifact", () => {
  it("redirects the retired playground URL to the current gallery without old assets", async () => {
    await writeManifest({ current: "next", versions: [{ id: "next", path: "/next/" }] })
    await writePage("client/next", "current docs")
    await writePage("client/storybook", "retired playground")
    await writeFile(path.join(root, "client/storybook/old-app.js"), "retired application")

    prepare()

    const redirect = await readFile(path.join(root, "pages/storybook/index.html"), "utf8")
    expect(redirect).toContain('content="0; url=/next/guide/component-playground/"')
    expect(redirect).toContain('href="/next/guide/component-playground/"')
    expect(await readdir(path.join(root, "pages/storybook"))).toEqual(["index.html"])
  })

  it("preserves archived pages and assets alongside the fresh current build", async () => {
    await writePage("source/v4", "archived docs")
    await mkdir(path.join(root, "source/v4/assets"))
    await writeFile(path.join(root, "source/v4/assets/app.js"), "old asset")
    await archive()
    await writeFile(path.join(root, "client/index.html"), "redirect to v5")
    await writeFile(path.join(root, "client/robots.txt"), "current metadata")

    expect(prepare()).toContain("Preserved v4")
    expect(await readFile(path.join(root, "pages/v5/index.html"), "utf8")).toBe("current docs")
    expect(await readFile(path.join(root, "pages/v4/index.html"), "utf8")).toBe("archived docs")
    expect(await readFile(path.join(root, "pages/v4/assets/app.js"), "utf8")).toBe("old asset")
    expect(await readFile(path.join(root, "pages/index.html"), "utf8")).toBe("redirect to v5")
    expect(await readFile(path.join(root, "pages/robots.txt"), "utf8")).toBe("current metadata")
    expect(await readFile(path.join(root, "pages/.nojekyll"), "utf8")).toBe("")
  })

  it("continues to accept unpacked snapshot directories", async () => {
    await writePage("snapshots/v4", "directory snapshot")
    prepare()
    expect(await readFile(path.join(root, "pages/v4/index.html"), "utf8")).toBe(
      "directory snapshot"
    )
  })

  it("keeps the previous artifact intact when a required snapshot is missing", async () => {
    await writePage("pages", "previous artifact")
    expect(() => prepare()).toThrow(/Missing deployed docs for v4/u)
    expect(await readFile(path.join(root, "pages/index.html"), "utf8")).toBe("previous artifact")
  })

  it("rejects an empty version directory", async () => {
    await mkdir(path.join(root, "client/v4"))
    expect(() => prepare()).toThrow(/Docs for v4.*is incomplete/u)
  })

  it("requires the current version to come from the fresh build", async () => {
    await rm(path.join(root, "client/v5"), { recursive: true })
    await writePage("snapshots/v5", "stale current docs")
    expect(() => prepare()).toThrow(/Current build for v5 is incomplete/u)
  })

  it.each([
    [null, /must declare/u],
    [{ current: "v5", versions: [] }, /must declare/u],
    [{ current: "v6", versions: [{ id: "v5", path: "/v5/" }] }, /not listed/u],
    [
      {
        current: "v5",
        versions: [
          { id: "v5", path: "/v5/" },
          { id: "v4", path: "/v5/" },
        ],
      },
      /Duplicate/u,
    ],
    [{ current: "v5", versions: [{ id: "v5", path: "/../outside/" }] }, /Unsafe/u],
  ])("rejects invalid version manifests (%j)", async (manifest, message) => {
    await writeManifest(manifest)
    expect(() => prepare()).toThrow(message)
  })

  it("fails when versions.json is missing instead of publishing an unchecked artifact", async () => {
    await rm(path.join(root, "client/versions.json"))
    expect(() => prepare()).toThrow(/versions.json/u)
  })

  it("rejects an output directory that would overwrite the build", () => {
    expect(() => prepare({ ARDO_PAGES_ARTIFACT_DIR: "client" })).toThrow(/must be separate/u)
  })

  it("rejects a modified archive", async () => {
    await writePage("source/v4", "archive")
    await archive()
    await writeFile(path.join(root, "snapshots/v4.tar.gz"), "corrupt archive")
    expect(() => prepare()).toThrow(/checksum mismatch/u)
  })

  it("rejects links inside archives", async () => {
    await writePage("source/v4", "archive")
    await symlink("index.html", path.join(root, "source/v4/link.html"))
    await archive()
    expect(() => prepare()).toThrow(/only regular files and directories/u)
  })

  it("prevents an archive from replacing the current build", async () => {
    await writePage("source/v5", "wrong archive")
    await archive("v5")
    expect(() => prepare()).toThrow(/contains files outside/u)
  })
})
