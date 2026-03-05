import fs from "node:fs"
import path from "node:path"

const __dirname = import.meta.dirname
const templatesRoot = path.resolve(__dirname, "..", "templates")
const packageJsonPath = path.resolve(__dirname, "..", "package.json")

type JsonObject = Record<string, unknown>

export function getCliVersion(): string {
  const pkg = readJsonObject(packageJsonPath)
  return typeof pkg?.version === "string" ? pkg.version : "0.0.0"
}

export const templates = [
  {
    name: "minimal",
    display: "Minimal",
    description: "Basic setup with essential files only",
  },
]

export interface ScaffoldOptions {
  siteTitle: string
  projectName: string
  typedoc: boolean
  githubPages: boolean
  description: string
}

export function createProjectStructure(root: string, template: string, options: ScaffoldOptions) {
  const templateDir = path.join(templatesRoot, template)
  const vars: Record<string, string> = {
    SITE_TITLE: options.siteTitle,
    PROJECT_NAME: options.projectName,
    ARDO_VERSION: getCliVersion(),
    TYPEDOC_CONFIG: options.typedoc
      ? "typedoc: true,"
      : "// typedoc: true, // Uncomment to enable API docs",
    GITHUB_PAGES_CONFIG: options.githubPages
      ? "// GitHub Pages: base path auto-detected from git remote"
      : "githubPages: false, // Disabled for non-GitHub Pages deployment",
    GITHUB_PAGES_BASENAME_IMPORT: options.githubPages
      ? 'import { detectGitHubBasename } from "ardo/vite"'
      : "",
    GITHUB_PAGES_BASENAME: options.githubPages
      ? "basename: detectGitHubBasename(),"
      : "// basename: detectGitHubBasename(), // Uncomment for GitHub Pages",
    DESCRIPTION: options.description,
  }

  copyDir(templateDir, root, vars)
}

function copyDir(src: string, dest: string, vars: Record<string, string>) {
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    // Rename _gitignore → .gitignore (npm strips .gitignore during pack)
    const destName = entry.name === "_gitignore" ? ".gitignore" : entry.name
    const destPath = path.join(dest, destName)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, vars)
    } else {
      let content = fs.readFileSync(srcPath, "utf8")
      for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{{${key}}}`, value)
      }
      fs.writeFileSync(destPath, content)
    }
  }
}

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

export function isEmpty(dirPath: string) {
  const files = fs.readdirSync(dirPath)
  return files.length === 0 || (files.length === 1 && files[0] === ".git")
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue
    }
    fs.rmSync(path.join(dir, file), { recursive: true, force: true })
  }
}

export function isValidTemplate(template: string) {
  return templates.some((t) => t.name === template)
}

export function detectProjectDescription(targetDir: string): string | undefined {
  for (const dir of [path.dirname(targetDir), targetDir]) {
    const pkgPath = path.join(dir, "package.json")
    const pkg = readJsonObject(pkgPath)
    if (pkg === undefined) {
      continue
    }

    if (typeof pkg.description === "string" && pkg.description !== "") {
      return pkg.description
    }
  }
  return undefined
}

// =============================================================================
// Upgrade Detection & Execution
// =============================================================================

export interface UpgradeResult {
  updated: string[]
  deleted: string[]
  skipped: string[]
}

export function isArdoProject(dir: string): boolean {
  const pkgPath = path.join(dir, "package.json")
  const pkg = readJsonObject(pkgPath)
  if (pkg === undefined) {
    return false
  }

  const dependencies = toStringRecord(pkg.dependencies)
  return dependencies?.ardo !== undefined
}

export function upgradeProject(root: string): UpgradeResult {
  const templateDir = path.join(templatesRoot, "minimal")
  const cliVersion = getCliVersion()
  const result: UpgradeResult = { updated: [], deleted: [], skipped: [] }

  // 1. Copy skeleton files directly (no variable substitution)
  const skeletonFiles = [
    "app/entry.client.tsx",
    "app/entry.server.tsx",
    "app/root.tsx",
    "tsconfig.json",
  ]

  for (const file of skeletonFiles) {
    const src = path.join(templateDir, file)
    const dest = path.join(root, file)
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
      result.updated.push(file)
    } else {
      result.skipped.push(file)
    }
  }

  // 2. Merge package.json
  const userPkgPath = path.join(root, "package.json")
  const templatePkgPath = path.join(templateDir, "package.json")
  const userPkg = readJsonObject(userPkgPath)
  const templatePkg = readJsonObject(templatePkgPath)
  if (userPkg === undefined || templatePkg === undefined) {
    throw new Error("Could not parse package.json while upgrading project")
  }
  const userDependencies = ensureStringRecord(userPkg, "dependencies")
  const userDevDependencies = ensureStringRecord(userPkg, "devDependencies")
  const templateDependencies = toStringRecord(templatePkg.dependencies) ?? {}
  const templateDevDependencies = toStringRecord(templatePkg.devDependencies) ?? {}

  // Always update ardo version
  userDependencies.ardo = `^${cliVersion}`

  // Add missing dependencies from template (don't overwrite user-pinned versions)
  for (const [dep, version] of Object.entries(templateDependencies)) {
    if (dep === "ardo") continue
    if (!(dep in userDependencies)) {
      userDependencies[dep] = version
    }
  }

  // Update pinned devDependencies from template (framework-controlled versions)
  for (const [dep, version] of Object.entries(templateDevDependencies)) {
    userDevDependencies[dep] = version
  }

  fs.writeFileSync(userPkgPath, `${JSON.stringify(userPkg, null, 2)}\n`)
  result.updated.push("package.json")

  // 3. Delete obsolete files
  const obsoleteFiles = ["app/vite-env.d.ts"]
  for (const file of obsoleteFiles) {
    const filePath = path.join(root, file)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      result.deleted.push(file)
    }
  }

  return result
}

function ensureStringRecord(object: JsonObject, key: string): Record<string, string> {
  const existing = toStringRecord(object[key])
  if (existing !== undefined) {
    object[key] = existing
    return existing
  }

  const created: Record<string, string> = {}
  object[key] = created
  return created
}

function readJsonObject(filePath: string): JsonObject | undefined {
  try {
    const raw = fs.readFileSync(filePath, "utf8")
    const parsed: unknown = JSON.parse(raw)
    return isJsonObject(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null
}

function toStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isJsonObject(value)) {
    return undefined
  }

  const entries = Object.entries(value)
  const result: Record<string, string> = {}
  for (const [key, entryValue] of entries) {
    if (typeof entryValue === "string") {
      result[key] = entryValue
    }
  }

  return result
}
