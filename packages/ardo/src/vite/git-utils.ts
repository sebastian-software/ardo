import { execFileSync, execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

/**
 * Finds the package root by looking for package.json in parent directories.
 * Returns the path relative to cwd, or undefined if not found.
 */
export function findPackageRoot(cwd: string): string | undefined {
  let currentDir = path.resolve(cwd)
  const filesystemRoot = path.parse(currentDir).root

  while (currentDir !== filesystemRoot) {
    const parentDir = path.dirname(currentDir)
    const packageJsonPath = path.join(parentDir, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      const relativePath = path.relative(cwd, parentDir)
      return relativePath === "" ? "." : relativePath
    }

    currentDir = parentDir
  }

  return undefined
}

/**
 * Detects the current short git commit hash.
 */
export function detectGitHash(cwd: string): string | undefined {
  return runGitCommand(cwd, "git rev-parse --short HEAD")
}

/** Read each source file's latest commit time in one Git invocation. */
export function getGitFileTimestamps(directory: string): Map<string, number> {
  const timestamps = new Map<string, number>()
  try {
    const history = execFileSync(
      "git",
      ["-c", "core.quotepath=false", "log", "--format=%ct", "--name-only", "--relative", "--", "."],
      {
        cwd: directory,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 16 * 1024 * 1024,
      }
    )
    let timestamp: number | undefined
    for (const line of history.split("\n")) {
      if (/^\d+$/u.test(line)) timestamp = Number(line) * 1000
      else if (line !== "" && timestamp != null && !timestamps.has(line))
        timestamps.set(line, timestamp)
    }
  } catch {
    // Source archives and fresh projects have no Git history; use file times.
  }
  return timestamps
}

/**
 * Recursively copies files from src to dest, overwriting existing files.
 */
export function copyRecursive(src: string, dest: string): void {
  const stat = fs.statSync(src)
  if (!stat.isDirectory()) {
    fs.copyFileSync(src, dest)
    return
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  for (const item of fs.readdirSync(src)) {
    copyRecursive(path.join(src, item), path.join(dest, item))
  }
}

function runGitCommand(cwd: string, command: string): string | undefined {
  try {
    const commandResult = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()

    return commandResult === "" ? undefined : commandResult
  } catch {
    return undefined
  }
}
