import fs from "node:fs/promises"
import path from "node:path"

type ExportOptions = { conditions: Set<string>; replacement?: string }
type ExportResolution = null | string | undefined

/** Resolve installed declarations without loading a package's JavaScript entry. */
export async function resolveDeclarationImport(
  file: string,
  request: string,
  packageRoot?: string
): Promise<string | undefined> {
  if (request.startsWith(".")) return declarationFile(path.resolve(path.dirname(file), request))
  const parsed = packageRequest(request)
  if (parsed == null) return undefined
  const starts = [path.dirname(await fs.realpath(file))]
  if (packageRoot != null) starts.push(path.resolve(packageRoot))
  for (const start of starts) {
    const directory = await findPackage(start, parsed.name)
    if (directory != null) return packageEntry(directory, parsed.subpath, file)
  }
  return undefined
}

function packageRequest(request: string): { name: string; subpath: string } | undefined {
  const parts = request.split("/")
  if (parts.some((part) => ["", ".", ".."].includes(part)) || /[\\:%#]/u.test(request))
    return undefined
  const name = parts.splice(0, request.startsWith("@") ? 2 : 1).join("/")
  return { name, subpath: parts.length === 0 ? "." : `./${parts.join("/")}` }
}

async function packageEntry(
  directory: string,
  subpath: string,
  file: string
): Promise<string | undefined> {
  const manifest = await readManifest(path.join(directory, "package.json"))
  if (manifest != null && Object.hasOwn(manifest, "exports")) {
    const mode = file.endsWith(".d.cts") ? "require" : "import"
    const selected = selectExport(manifest.exports, subpath)
    if (selected == null) return undefined
    const resolved = await exportTarget(directory, selected.target, {
      conditions: new Set(["types", "node", mode, "default"]),
      replacement: selected.replacement,
    })
    return resolved ?? undefined
  }
  // Version-dependent mappings need the emitter's version and configuration.
  if (manifest?.typesVersions != null) return undefined
  if (subpath !== ".") return declarationFile(path.join(directory, subpath))
  return legacyEntry(directory, manifest)
}

async function legacyEntry(
  directory: string,
  manifest?: Record<string, unknown>
): Promise<string | undefined> {
  for (const entry of [manifest?.types, manifest?.typings, manifest?.main, "index"]) {
    if (typeof entry !== "string") continue
    const resolved = await declarationFile(path.resolve(directory, entry))
    if (resolved != null) return resolved
  }
  return undefined
}

async function findPackage(start: string, name: string): Promise<string | undefined> {
  let directory = start
  for (;;) {
    const candidate = path.join(directory, "node_modules", name)
    if (await exists(candidate, "directory")) return candidate
    const parent = path.dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}

function selectExport(
  exports: unknown,
  subpath: string
): { target: unknown; replacement?: string } | undefined {
  if (!isRecord(exports) || !Object.keys(exports).some((key) => key.startsWith(".")))
    return subpath === "." ? { target: exports } : undefined
  if (Object.hasOwn(exports, subpath)) return { target: exports[subpath] }
  const match = Object.keys(exports)
    .filter((key) => matchesPattern(key, subpath))
    .sort((left, right) => right.indexOf("*") - left.indexOf("*") || right.length - left.length)
    .at(0)
  if (match == null) return undefined
  const [prefix, suffix] = match.split("*")
  return {
    target: exports[match],
    replacement: subpath.slice(prefix.length, subpath.length - suffix.length),
  }
}

function matchesPattern(key: string, subpath: string): boolean {
  const parts = key.split("*")
  if (parts.length !== 2) return false
  const [prefix, suffix] = parts
  return (
    subpath.startsWith(prefix) &&
    subpath.endsWith(suffix) &&
    subpath.length >= prefix.length + suffix.length
  )
}

async function exportTarget(
  directory: string,
  target: unknown,
  options: ExportOptions
): Promise<ExportResolution> {
  if (target === null) return null
  if (typeof target === "string") {
    const entry = exportPath(target, options.replacement)
    return entry == null ? undefined : declarationFile(path.resolve(directory, entry))
  }
  if (Array.isArray(target)) return resolveTargets(directory, target, options)
  if (isRecord(target)) {
    // Do not silently choose a possibly different type-version branch.
    if (Object.keys(target).some((condition) => condition.startsWith("types@"))) return null
    const entries = Object.entries(target).filter(([condition]) =>
      options.conditions.has(condition)
    )
    return resolveTargets(
      directory,
      entries.map(([, entry]) => entry),
      options
    )
  }
  return undefined
}

function exportPath(target: string, replacement?: string): string | undefined {
  const entry = replacement == null ? target : target.replaceAll("*", replacement)
  if (
    !entry.startsWith("./") ||
    /[\\%]/u.test(entry) ||
    entry.split("/").some((part) => ["..", "node_modules"].includes(part))
  )
    return undefined
  return entry
}

async function resolveTargets(
  directory: string,
  targets: unknown[],
  options: ExportOptions
): Promise<ExportResolution> {
  for (const entry of targets) {
    const resolved = await exportTarget(directory, entry, options)
    if (resolved !== undefined) return resolved
  }
  return undefined
}

async function readManifest(file: string): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = JSON.parse(await fs.readFile(file, "utf8"))
    return isRecord(value) ? value : undefined
  } catch (error) {
    if (!missing(error)) throw error
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

async function declarationFile(base: string): Promise<string | undefined> {
  for (const candidate of declarationCandidates(base))
    if (await exists(candidate, "file")) return fs.realpath(candidate)
  return undefined
}

async function exists(file: string, kind: "directory" | "file"): Promise<boolean> {
  try {
    const stat = await fs.stat(file)
    return kind === "file" ? stat.isFile() : stat.isDirectory()
  } catch (error) {
    if (!missing(error)) throw error
    return false
  }
}

function missing(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  )
}

function declarationCandidates(base: string): string[] {
  if (/\.d\.(?:ts|mts|cts)$/u.test(base)) return [base]
  const extensions = new Map([
    [".js", ".d.ts"],
    [".mjs", ".d.mts"],
    [".cjs", ".d.cts"],
    [".ts", ".d.ts"],
    [".mts", ".d.mts"],
    [".cts", ".d.cts"],
  ])
  const extension = path.extname(base)
  const declarationExtension = extensions.get(extension)
  if (declarationExtension != null) return [base.slice(0, -extension.length) + declarationExtension]
  if (extension !== "") return []
  return [
    `${base}.d.ts`,
    `${base}.d.mts`,
    `${base}.d.cts`,
    ...["index.d.ts", "index.d.mts", "index.d.cts"].map((entry) => path.join(base, entry)),
  ]
}
