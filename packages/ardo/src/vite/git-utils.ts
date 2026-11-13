import { execFileSync, execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"

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

/** A misspelled `sourceRoot` would silently date every page by the copy; name it instead. */
export function assertSourceRoot({ sourceRoot }: Pick<ResolvedConfig, "sourceRoot">): void {
  if (
    sourceRoot != null &&
    fs.statSync(sourceRoot, { throwIfNoEntry: false })?.isDirectory() !== true
  )
    throw new Error(`[ardo] sourceRoot must name an existing directory: ${sourceRoot}`)
}

/**
 * The directory whose Git history describes `directory`. With `sourceRoot`, a directory inside the
 * project maps to the same relative path under the project that this build's copy mirrors.
 * Without it, or for a directory outside the project, it is `directory` itself.
 */
export function sourceHistoryDirectory(
  directory: string,
  config: Pick<ResolvedConfig, "root" | "sourceRoot"> | undefined
): string {
  if (config?.sourceRoot == null) return directory
  const relative = path.relative(config.root, directory)
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    return directory
  return path.join(config.sourceRoot, relative)
}

/** Starts each commit's header in `git log -z` output; no tracked file name starts with it. */
const COMMIT_MARKER = "\u0001"

let warnedHistoryFailure = false

/**
 * Read commit dates only for tracked files that exist, keyed by their path relative to
 * `directory`; generated routes, and files the directory lacks, use file times.
 */
export function getGitFileTimestamps(directory: string): Map<string, number> {
  const timestamps = new Map<string, number>()
  try {
    const tracked = new Set(
      readGit(directory, ["ls-files", "-z", "--", "."])
        .split("\0")
        // A staged copy can still have a file that the source deleted without a commit.
        .filter((file) => file !== "" && fs.existsSync(path.join(directory, file)))
    )
    // With -z, names arrive unquoted, so tabs, quotes, and non-ASCII names match `tracked`.
    const history = readGit(directory, [
      "log",
      "-z",
      `--format=${COMMIT_MARKER}%ct`,
      "--name-only",
      "--relative",
      "--",
      ".",
    ])
    let timestamp: number | undefined
    let afterHeader = false
    for (const token of history.split("\0")) {
      // Git separates a commit header from its first file name with a newline.
      const field = afterHeader && token.startsWith("\n") ? token.slice(1) : token
      afterHeader = field.startsWith(COMMIT_MARKER)
      if (afterHeader) timestamp = Number(field.slice(COMMIT_MARKER.length)) * 1000
      else if (tracked.has(field) && timestamp != null && !timestamps.has(field))
        timestamps.set(field, timestamp)
    }
  } catch (error) {
    // Source archives and fresh projects have no Git history; use file times. A repository whose
    // history cannot be read would date every page by its checkout, so say so.
    if (!warnedHistoryFailure && hasCommits(directory)) {
      warnedHistoryFailure = true
      console.warn(
        `[ardo] Could not read the Git history of ${directory}; page dates use file times instead. ${formatGitError(error)}`
      )
    }
  }
  return timestamps
}

function readGit(directory: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: directory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // A long history can exceed any fixed limit, and a cut-off log would lose every date.
    maxBuffer: Number.POSITIVE_INFINITY,
  })
}

function hasCommits(directory: string): boolean {
  try {
    readGit(directory, ["rev-parse", "--verify", "--quiet", "HEAD"])
    return true
  } catch {
    return false
  }
}

function formatGitError(error: unknown): string {
  const stderr =
    typeof error === "object" && error != null && "stderr" in error ? String(error.stderr) : ""
  return stderr.trim() || (error instanceof Error ? error.message : String(error))
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
