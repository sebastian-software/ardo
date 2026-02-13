import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesRoot = path.resolve(__dirname, "..", "templates")
const packageJsonPath = path.resolve(__dirname, "..", "package.json")

export function getCliVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  return pkg.version
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
    TYPEDOC_NAV: options.typedoc ? "{ text: 'API', link: '/api-reference' }," : "",
    TYPEDOC_SIDEBAR: options.typedoc ? "{ text: 'API Reference', link: '/api-reference' }," : "",
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
      let content = fs.readFileSync(srcPath, "utf-8")
      for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{{${key}}}`, value)
      }
      fs.writeFileSync(destPath, content)
    }
  }
}

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, "")
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
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
      if (pkg.description) {
        return pkg.description
      }
    } catch {
      // package.json doesn't exist or is invalid
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
  try {
    const pkgPath = path.join(dir, "package.json")
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
    return Boolean(pkg.dependencies?.ardo)
  } catch {
    return false
  }
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
  const userPkg = JSON.parse(fs.readFileSync(userPkgPath, "utf-8"))
  const templatePkg = JSON.parse(fs.readFileSync(templatePkgPath, "utf-8"))

  // Always update ardo version
  if (userPkg.dependencies) {
    userPkg.dependencies.ardo = `^${cliVersion}`
  }

  // Add missing dependencies from template (don't overwrite user-pinned versions)
  for (const [dep, version] of Object.entries(
    (templatePkg.dependencies || {}) as Record<string, string>
  )) {
    if (dep === "ardo") continue
    if (!userPkg.dependencies?.[dep]) {
      userPkg.dependencies = userPkg.dependencies || {}
      userPkg.dependencies[dep] = version
    }
  }

  // Update pinned devDependencies from template (framework-controlled versions)
  for (const [dep, version] of Object.entries(
    (templatePkg.devDependencies || {}) as Record<string, string>
  )) {
    userPkg.devDependencies = userPkg.devDependencies || {}
    userPkg.devDependencies[dep] = version
  }

  fs.writeFileSync(userPkgPath, JSON.stringify(userPkg, null, 2) + "\n")
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
