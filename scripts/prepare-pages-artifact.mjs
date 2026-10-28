#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const clientDir = path.resolve(root, process.env.ARDO_PAGES_CLIENT_DIR ?? "docs/build/client")
const artifactDir = path.resolve(root, process.env.ARDO_PAGES_ARTIFACT_DIR ?? "docs/build/pages")
const snapshotsDir = path.resolve(
  root,
  process.env.ARDO_PAGES_VERSION_SNAPSHOTS_DIR ?? "docs/version-snapshots"
)

// Never let an output override remove its own inputs.
for (const input of [clientDir, snapshotsDir]) {
  if (isWithin(input, artifactDir) || isWithin(artifactDir, input)) {
    throw new Error("The Pages artifact directory must be separate from the build and snapshots.")
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(clientDir, "versions.json"), "utf8"))
const versions = validateVersions(manifest)
const current = versions.find((version) => version.id === manifest.current)
await requirePage(path.join(clientDir, current.folder), `Current build for ${current.id}`)

await fs.mkdir(path.dirname(artifactDir), { recursive: true })
const stagingDir = await fs.mkdtemp(`${artifactDir}.tmp-`)
try {
  await fs.cp(clientDir, stagingDir, { recursive: true })
  for (const version of versions) {
    const target = path.join(stagingDir, version.folder)
    if (!(await pathExists(target))) {
      await restoreSnapshot(version, stagingDir)
    }
    await requirePage(target, `Docs for ${version.id} (${version.path})`)
  }

  // Preserve the former playground URL without shipping the retired application.
  const playgroundDir = path.join(stagingDir, "storybook")
  const galleryPath = `${current.path}${current.locales?.[0] == null ? "" : `${current.locales[0]}/`}guide/components/`
  await fs.rm(playgroundDir, { force: true, recursive: true })
  await fs.mkdir(playgroundDir)
  await fs.writeFile(
    path.join(playgroundDir, "index.html"),
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Ardo Component Gallery</title>\n<meta http-equiv="refresh" content="0; url=${galleryPath}">\n<link rel="canonical" href="${galleryPath}">\n</head>\n<body><a href="${galleryPath}">Open the component gallery</a></body>\n</html>\n`
  )

  // Archived builds can include underscore-prefixed assets that Jekyll would hide.
  await fs.writeFile(path.join(stagingDir, ".nojekyll"), "")
  await fs.rm(artifactDir, { force: true, recursive: true })
  await fs.rename(stagingDir, artifactDir)
} finally {
  await fs.rm(stagingDir, { force: true, recursive: true })
}

console.log(`Prepared GitHub Pages artifact at ${path.relative(root, artifactDir)}`)

function validateVersions(manifest) {
  if (
    manifest == null ||
    typeof manifest.current !== "string" ||
    !Array.isArray(manifest.versions) ||
    manifest.versions.length === 0
  ) {
    throw new Error("versions.json must declare a current version and a nonempty versions list.")
  }

  const ids = new Set()
  const folders = new Set()
  const versions = manifest.versions.map((version) => {
    if (version == null || typeof version.id !== "string" || version.id.length === 0) {
      throw new Error("Every version must have a nonempty id.")
    }
    if (typeof version.path !== "string" || !/^\/(?:[\w.-]+\/)*$/u.test(version.path)) {
      throw new Error(`Invalid version path for ${version.id}: ${version.path}`)
    }
    const folder = version.path.slice(1, -1)
    if (folder.split("/").some((part) => part === "." || part === "..")) {
      throw new Error(`Unsafe version path for ${version.id}: ${version.path}`)
    }
    if (ids.has(version.id) || folders.has(folder)) {
      throw new Error(`Duplicate version id or path: ${version.id} (${version.path})`)
    }
    ids.add(version.id)
    folders.add(folder)
    return { ...version, folder }
  })
  if (!ids.has(manifest.current)) {
    throw new Error(`Current version ${manifest.current} is not listed in versions.json.`)
  }
  return versions
}

async function restoreSnapshot(version, stagingDir) {
  const snapshotDir = path.join(snapshotsDir, version.folder)
  if (version.folder !== "" && (await pathExists(snapshotDir))) {
    await fs.cp(snapshotDir, path.join(stagingDir, version.folder), { recursive: true })
  } else {
    const archive = path.join(snapshotsDir, `${version.folder}.tar.gz`)
    if (!(await pathExists(archive))) {
      throw new Error(
        `Missing deployed docs for ${version.id} (${version.path}). Add a snapshot at ${snapshotDir} or ${archive} before changing the current version.`
      )
    }
    const metadata = JSON.parse(
      await fs.readFile(path.join(snapshotsDir, "snapshots.json"), "utf8")
    )
    const expected = metadata[version.id]?.sha256
    const actual = createHash("sha256")
      .update(await fs.readFile(archive))
      .digest("hex")
    if (actual !== expected) {
      throw new Error(`Snapshot checksum mismatch for ${version.id}.`)
    }
    const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n")
    if (
      entries.some((entry) => {
        const normalized = entry.replace(/^\.\//u, "").replace(/\/$/u, "")
        return (
          (normalized !== version.folder && !normalized.startsWith(`${version.folder}/`)) ||
          normalized.split("/").some((part) => part === "." || part === "..") ||
          normalized.includes("\\")
        )
      })
    ) {
      throw new Error(`Snapshot archive for ${version.id} contains files outside ${version.path}.`)
    }
    const listing = execFileSync("tar", ["-tvzf", archive], { encoding: "utf8" })
    if (
      listing
        .trim()
        .split("\n")
        .some((entry) => !/^[d-]/u.test(entry))
    ) {
      throw new Error(
        `Snapshot archive for ${version.id} must contain only regular files and directories.`
      )
    }
    execFileSync("tar", ["-xzf", archive, "-C", stagingDir])
  }
  console.log(`Preserved ${version.id} from ${path.relative(root, snapshotsDir)}`)
}

async function requirePage(directory, description) {
  const index = path.join(directory, "index.html")
  const stat = await fs.stat(index).catch((error) => {
    if (error.code === "ENOENT") return null
    throw error
  })
  if (stat == null || !stat.isFile() || stat.size === 0) {
    throw new Error(`${description} is incomplete: missing nonempty ${index}.`)
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child)
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  )
}
