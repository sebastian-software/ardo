import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
if (process.argv.length !== 3)
  throw new Error("Usage: node scripts/prepare-large-api-benchmark.mjs /path/to/isolated-inputs")
const directory = path.resolve(process.argv[2])
await fs.mkdir(directory, { recursive: true })
const manifest = {
  name: "ardo-large-api-inputs",
  private: true,
  type: "module",
  dependencies: {
    rxjs: "7.8.2",
    effect: "4.0.3",
    tslib: "2.8.1",
  },
}
const manifestFile = path.join(directory, "package.json")
const existing = await fs.readFile(manifestFile, "utf8").catch((error) => {
  if (error.code !== "ENOENT") throw error
  return undefined
})
if (existing && JSON.parse(existing).name !== manifest.name)
  throw new Error("Use a separate directory for these benchmark inputs.")
await fs.writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)
// Published packages include the original TypeScript sources. Package scripts never run.
execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: directory,
  stdio: "inherit",
})
const lock = JSON.parse(await fs.readFile(path.join(directory, "package-lock.json"), "utf8"))
const profiles = [
  {
    name: "ardo",
    entry: path.join(root, "packages/ardo/src/index.ts"),
    config: path.join(root, "packages/ardo/tsconfig.json"),
    sourceRoot: path.join(root, "packages/ardo/src"),
    ambient: [path.join(root, "packages/ardo/src/vite-env.d.ts")],
    typeRoots: [path.join(root, "node_modules/@types")],
  },
]
const compatibilityProfiles = []
for (const [id, name, entry, version] of [
  ["rxjs", "rxjs", "index.ts", "7.8.2"],
  ["effect", "effect", "Effect.ts", "4.0.3"],
]) {
  const distribution = path.join(directory, "node_modules", id)
  const packageRoot = path.join(directory, "projects", id)
  const installed = JSON.parse(await fs.readFile(path.join(distribution, "package.json"), "utf8"))
  const locked = lock.packages[`node_modules/${id}`]
  if (installed.version !== version)
    throw new Error(`Unexpected ${name} version: ${installed.version}`)
  // Compilers treat imported node_modules sources as external and do not emit them.
  // Copy the unmodified sources into a source project; retain module/package identity.
  await fs.mkdir(packageRoot, { recursive: true })
  await fs.cp(path.join(distribution, "src"), path.join(packageRoot, "src"), { recursive: true })
  await fs.copyFile(path.join(distribution, "package.json"), path.join(packageRoot, "package.json"))
  const compilerOptions =
    name === "rxjs"
      ? {
          // Preserve source checking and public declaration settings; replace legacy Node10/baseUrl.
          target: "ESNext",
          lib: ["ESNext", "DOM"],
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          noImplicitReturns: true,
          preserveConstEnums: true,
          stripInternal: true,
          types: [],
        }
      : {
          // The package does not publish its monorepo tsconfig; use its documented strict settings.
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          rewriteRelativeImportExtensions: true,
          verbatimModuleSyntax: true,
          strict: true,
          exactOptionalPropertyTypes: true,
          noImplicitOverride: true,
          skipLibCheck: true,
          types: ["node"],
          typeRoots: [path.join(root, "node_modules/@types")],
        }
  const config = path.join(directory, `${id}.tsconfig.json`)
  await fs.writeFile(config, `${JSON.stringify({ compilerOptions }, null, 2)}\n`)
  const profile = {
    name: name === "effect" ? "effect-original" : name,
    entry: path.join(packageRoot, "src", entry),
    config,
    sourceRoot: path.join(packageRoot, "src"),
    packageRoot,
    provenance: {
      package: name,
      version: installed.version,
      tarball: locked.resolved,
      integrity: locked.integrity,
      repository: installed.repository,
      entryScope:
        name === "effect"
          ? "Effect.ts public module and its transitive source graph"
          : "Root public barrel and its transitive source graph",
    },
  }
  if (name === "rxjs") profiles.push(profile)
  else {
    compatibilityProfiles.push(profile)
    const annotated = path.join(directory, "projects", "effect-annotated")
    await fs.cp(packageRoot, annotated, { recursive: true })
    const adjustedFile = path.join(annotated, "src/SchemaAST.ts")
    const original = await fs.readFile(adjustedFile, "utf8")
    const before = "return Effect.flatMap(Effect.exit(pending), (exit) => {"
    const after =
      "return Effect.flatMap(Effect.exit(pending), (exit): Effect.Effect<unknown, SchemaIssue.Issue, any> => {"
    if (original.split(before).length !== 2)
      throw new Error("The pinned Effect compatibility adjustment no longer matches exactly once.")
    await fs.writeFile(adjustedFile, original.replace(before, after))
    profiles.push({
      ...profile,
      name: "effect-core-annotated",
      packageRoot: annotated,
      entry: path.join(annotated, "src", entry),
      sourceRoot: path.join(annotated, "src"),
      provenance: {
        ...profile.provenance,
        sourceAdjustment: {
          file: "src/SchemaAST.ts",
          before,
          after,
          reason:
            "The pinned native compiler rejects the original inferred callback return; both compilers check this explicit internal return type.",
        },
      },
    })
  }
}
const profileFile = path.join(directory, "profiles.json")
await fs.writeFile(profileFile, `${JSON.stringify(profiles, null, 2)}\n`)
await fs.writeFile(
  path.join(directory, "compatibility-profiles.json"),
  `${JSON.stringify(compatibilityProfiles, null, 2)}\n`
)
console.log(profileFile)
