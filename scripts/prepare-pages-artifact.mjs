#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const clientDir = path.resolve(root, process.env.ARDO_PAGES_CLIENT_DIR ?? "docs/build/client")
const artifactDir = path.resolve(root, process.env.ARDO_PAGES_ARTIFACT_DIR ?? "docs/build/pages")
const snapshotsDir = path.resolve(
  root,
  process.env.ARDO_PAGES_VERSION_SNAPSHOTS_DIR ?? "docs/version-snapshots"
)

await resetDirectory(artifactDir)
await copyDirectory(clientDir, artifactDir)

const versions = await readVersions(path.join(clientDir, "versions.json"))
for (const version of versions) {
  const versionFolder = normalizeVersionFolder(version.path)
  if (versionFolder == null) {
    continue
  }

  const generatedVersionDir = path.join(artifactDir, versionFolder)
  if (await pathExists(generatedVersionDir)) {
    continue
  }

  const snapshotDir = path.join(snapshotsDir, versionFolder)
  if (await pathExists(snapshotDir)) {
    await copyDirectory(snapshotDir, generatedVersionDir)
    console.log(`Preserved ${version.id} from ${path.relative(root, snapshotDir)}`)
    continue
  }

  throw new Error(
    [
      `Missing deployed docs for ${version.id} (${version.path}).`,
      `The current build did not produce ${path.relative(root, generatedVersionDir)},`,
      `and no snapshot exists at ${path.relative(root, snapshotDir)}.`,
      "Add a snapshot before cutting this release so GitHub Pages does not delete stable major-version URLs.",
    ].join(" ")
  )
}

console.log(`Prepared GitHub Pages artifact at ${path.relative(root, artifactDir)}`)

async function readVersions(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.versions)) {
      return []
    }

    return parsed.versions.filter(
      (version) =>
        version != null && typeof version.id === "string" && typeof version.path === "string"
    )
  } catch (error) {
    if (error?.code === "ENOENT") {
      return []
    }

    throw error
  }
}

function normalizeVersionFolder(versionPath) {
  const trimmed = versionPath.replaceAll(/^\/|\/$/gu, "")
  return trimmed === "" ? null : trimmed
}

async function resetDirectory(directory) {
  await fs.rm(directory, { force: true, recursive: true })
  await fs.mkdir(directory, { recursive: true })
}

async function copyDirectory(source, destination) {
  await fs.cp(source, destination, { recursive: true })
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
