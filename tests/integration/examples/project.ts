import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export const repositoryRoot = path.resolve(import.meta.dirname, "../../..")
export const basicDirectory = path.join(repositoryRoot, "examples/basic")
export const fixturesDirectory = path.join(repositoryRoot, "tests/fixtures")

const excluded = new Set(["node_modules", "build", ".api-declarations", "app/routes/api-reference"])

function copySource(source: string, destination: string): void {
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (file) => !excluded.has(path.relative(source, file).split(path.sep).join("/")),
  })
}

/** Apply a feature-specific overlay to the same source that readers copy. */
export function copyProjectSource(destination: string, fixture?: string): void {
  copySource(basicDirectory, destination)
  if (fixture == null) return
  const baseManifest = JSON.parse(fs.readFileSync(path.join(destination, "package.json"), "utf8"))
  const source = path.join(fixturesDirectory, fixture)
  copySource(source, destination)
  const manifestPath = path.join(source, "package.json")
  if (!fs.existsSync(manifestPath)) return
  const overlay = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  fs.writeFileSync(
    path.join(destination, "package.json"),
    `${JSON.stringify(
      {
        ...baseManifest,
        ...overlay,
        scripts: { ...baseManifest.scripts, ...overlay.scripts },
        dependencies: { ...baseManifest.dependencies, ...overlay.dependencies },
        devDependencies: { ...baseManifest.devDependencies, ...overlay.devDependencies },
      },
      null,
      2
    )}\n`
  )
}

/** Use the workspace's installed dependencies without borrowing ancestor packages. */
export function createTestProject(fixture?: string): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `ardo-${fixture ?? "basic"}-`))
  copyProjectSource(directory, fixture)
  const dependencyRoot =
    fixture != null && fs.existsSync(path.join(fixturesDirectory, fixture, "package.json"))
      ? path.join(fixturesDirectory, fixture)
      : basicDirectory
  const sourceModules = path.join(dependencyRoot, "node_modules")
  const modules = path.join(directory, "node_modules")
  fs.mkdirSync(modules)
  for (const entry of fs.readdirSync(sourceModules)) {
    if (entry.startsWith(".")) continue
    fs.symlinkSync(path.join(sourceModules, entry), path.join(modules, entry), "junction")
  }
  // pnpm's generated shims contain workspace-relative paths. Give the copied
  // project absolute executable links while keeping its package scripts intact.
  const bins = path.join(modules, ".bin")
  fs.mkdirSync(bins)
  for (const [name, entry] of [
    ["ardo", "ardo/bin/ardo.js"],
    ["tsc", "typescript/bin/tsc"],
  ]) {
    fs.symlinkSync(fs.realpathSync(path.join(sourceModules, entry)), path.join(bins, name))
  }
  return directory
}
