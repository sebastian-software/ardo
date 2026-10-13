import { createHash } from "node:crypto"
import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

const VITE_CONFIG_NAMES = [
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.ts",
  "vite.config.cjs",
  "vite.config.mts",
  "vite.config.cts",
] as const

const ARDO_CONFIG_NAMES = [
  "ardo.config.ts",
  "ardo.config.js",
  "ardo.config.mjs",
  "ardo.config.mts",
  "ardo.config.cjs",
  "ardo.config.cts",
] as const

type ProjectConfigIdentity = {
  root: string
  ardoConfigPath: string | undefined
  viteConfigPath: string | undefined
  ardoViteEntry: string
}

/**
 * Prepare a watched Vite config wrapper for the selected Ardo project root.
 * Vite watches edits to imported config files; restart Ardo after adding or removing one so the
 * wrapper can update its static imports.
 */
export async function prepareProjectConfig(
  root: string,
  explicitVitePath?: string
): Promise<string> {
  const projectRoot = path.resolve(root)
  const ardoConfigPath = await findProjectConfig(projectRoot, ARDO_CONFIG_NAMES)
  const viteConfigPath =
    explicitVitePath === undefined
      ? await findProjectConfig(projectRoot, VITE_CONFIG_NAMES)
      : await resolveExplicitViteConfig(projectRoot, explicitVitePath)
  const ardoViteEntry = import.meta.resolve("ardo/vite")
  const identity = { root: projectRoot, ardoConfigPath, viteConfigPath, ardoViteEntry }
  const wrapperPath = getWrapperPath(identity)
  const wrapperContents = createWrapperContents(identity)

  await mkdir(path.dirname(wrapperPath), { recursive: true })
  if (!(await fileContains(wrapperPath, wrapperContents))) {
    await writeFile(wrapperPath, wrapperContents, "utf8")
  }
  return wrapperPath
}

async function findProjectConfig(
  root: string,
  names: readonly string[]
): Promise<string | undefined> {
  for (const name of names) {
    const candidate = path.join(root, name)
    if (await isFile(candidate)) return candidate
  }
  return undefined
}

async function resolveExplicitViteConfig(root: string, configPath: string): Promise<string> {
  const resolvedPath = path.resolve(root, configPath)
  if (!(await isFile(resolvedPath))) {
    throw new Error(`[ardo] Vite config file not found: ${resolvedPath}`)
  }
  return resolvedPath
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath)
    return fileStats.isFile()
  } catch (error) {
    if (isMissingPath(error)) return false
    throw error
  }
}

async function fileContains(filePath: string, expectedContents: string): Promise<boolean> {
  try {
    return (await readFile(filePath, "utf8")) === expectedContents
  } catch (error) {
    if (isMissingPath(error)) return false
    throw error
  }
}

function isMissingPath(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function getWrapperPath(identity: ProjectConfigIdentity): string {
  const hash = createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 12)
  return path.join(identity.root, "node_modules", ".ardo", `vite-${hash}.config.mjs`)
}

function createWrapperContents(identity: ProjectConfigIdentity): string {
  return [
    `const ardoViteEntry = ${JSON.stringify(identity.ardoViteEntry)};`,
    "const { createArdoProjectViteConfig } = await import(ardoViteEntry);",
    createConfigImport("ardoConfig", identity.ardoConfigPath),
    createConfigImport("viteConfig", identity.viteConfigPath),
    `export default createArdoProjectViteConfig(${JSON.stringify(identity.root)}, { ardoConfig, viteConfig, sources: ${JSON.stringify({ ardoConfigPath: identity.ardoConfigPath, viteConfigPath: identity.viteConfigPath })} });`,
    "",
  ].join("\n")
}

function createConfigImport(name: string, configPath: string | undefined): string {
  if (configPath === undefined) return `const ${name} = undefined;`
  return [
    `import * as ${name}Module from ${JSON.stringify(pathToFileURL(configPath).href)};`,
    `const ${name} = ${name}Module.default;`,
  ].join("\n")
}
