import path from "node:path"

export function formatTargetDir(targetDir: string | undefined) {
  if (targetDir === undefined) {
    return
  }

  let normalized = targetDir.trim()
  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

export function validateTargetDir(targetDir: string | undefined): string | true {
  const normalized = formatTargetDir(targetDir)
  if (normalized === undefined || normalized === "") {
    return "Project name is required"
  }

  if (normalized === ".") {
    return true
  }

  if (path.isAbsolute(normalized)) {
    return "Project name must be a relative path"
  }

  const segments = normalized.split(/[\\/]+/)
  if (segments.some((segment) => segment === "" || segment === "..")) {
    return "Project name must not contain empty or parent-directory path segments"
  }

  const baseName = path.basename(normalized)
  if (/^[.-]/.test(baseName)) {
    return "Project name cannot start with a dot or hyphen"
  }

  return true
}

export function normalizeTargetDir(targetDir: string): string {
  const normalized = formatTargetDir(targetDir) ?? ""
  const validation = validateTargetDir(normalized)
  if (validation !== true) {
    throw new Error(validation)
  }
  return normalized
}

export function toPackageName(targetDir: string, root = path.resolve(targetDir)): string {
  const rawName = targetDir === "." ? path.basename(root) : path.basename(targetDir)
  let name = rawName
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, "-")

  while (/^[._-]/.test(name)) {
    name = name.slice(1)
  }

  while (/[._-]$/.test(name)) {
    name = name.slice(0, -1)
  }

  return name === "" ? "my-docs" : name
}
