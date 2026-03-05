import { execSync } from "node:child_process"
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
 * Detects the GitHub repository name from git remote URL.
 * Returns the repo name (e.g., "ardo" from "github.com/sebastian-software/ardo")
 * or undefined if not a GitHub repo.
 */
export function detectGitHubRepoName(cwd: string): string | undefined {
  const remoteUrl = runGitCommand(cwd, "git remote get-url origin")
  if (remoteUrl == null) {
    return undefined
  }

  return parseGitHubRepoName(remoteUrl)
}

/**
 * Detects the current short git commit hash.
 */
export function detectGitHash(cwd: string): string | undefined {
  return runGitCommand(cwd, "git rev-parse --short HEAD")
}

/**
 * Detects the GitHub Pages basename from the git remote URL.
 * Returns "/" in dev mode or when no GitHub repo is detected.
 */
export function detectGitHubBasename(cwd?: string): string {
  if (process.env.NODE_ENV !== "production") {
    return "/"
  }

  const repoName = detectGitHubRepoName(cwd ?? process.cwd())
  return repoName != null ? `/${repoName}/` : "/"
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

function parseGitHubRepoName(remoteUrl: string): string | undefined {
  const normalizedUrl = remoteUrl.trim()
  if (!normalizedUrl.includes("github.com")) {
    return undefined
  }

  const withoutGitSuffix = normalizedUrl.endsWith(".git")
    ? normalizedUrl.slice(0, -4)
    : normalizedUrl
  const slashSeparatedUrl = withoutGitSuffix.replace(":", "/")
  const urlSegments = slashSeparatedUrl.split("/")
  const repoName = urlSegments.at(-1)
  const ownerName = urlSegments.at(-2)

  if (repoName == null || repoName === "" || ownerName == null || ownerName === "") {
    return undefined
  }

  return repoName
}
