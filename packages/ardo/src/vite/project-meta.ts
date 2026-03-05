import fs from "node:fs"
import path from "node:path"

import type { ProjectMeta } from "../config/types"

interface PackageJsonShape {
  author?: { name?: string } | string
  homepage?: string
  license?: string
  name?: string
  repository?: { url?: string } | string
  version?: string
}

/**
 * Reads project metadata from package.json.
 */
export function readProjectMeta(root: string): ProjectMeta {
  const packageJsonPath = path.join(root, "package.json")

  try {
    const rawPackageJson = fs.readFileSync(packageJsonPath, "utf8")
    const parsedPackageJson: unknown = JSON.parse(rawPackageJson)
    if (!isPackageJsonShape(parsedPackageJson)) {
      return {}
    }

    const repository = extractRepository(parsedPackageJson.repository)
    const author = extractAuthor(parsedPackageJson.author)

    return {
      name: parsedPackageJson.name,
      homepage: parsedPackageJson.homepage,
      repository,
      version: parsedPackageJson.version,
      author,
      license: parsedPackageJson.license,
    }
  } catch {
    return {}
  }
}

function extractRepository(repository: PackageJsonShape["repository"]): string | undefined {
  if (typeof repository === "string") {
    return normalizeRepository(repository)
  }

  if (repository == null || typeof repository.url !== "string") {
    return undefined
  }

  return normalizeRepository(repository.url)
}

function extractAuthor(author: PackageJsonShape["author"]): string | undefined {
  if (typeof author === "string") {
    return author
  }

  if (author == null || typeof author.name !== "string") {
    return undefined
  }

  return author.name
}

function normalizeRepository(repository: string): string {
  return repository
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "")
}

function isPackageJsonShape(value: unknown): value is PackageJsonShape {
  return typeof value === "object" && value != null
}
