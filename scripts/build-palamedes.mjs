import { spawnSync } from "node:child_process"
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const docs = fileURLToPath(new URL("../docs/", import.meta.url))
const archive = await realpath(path.join(docs, "node_modules/@palamedes/source"))
const source = path.join(docs, ".cache/palamedes")
const docsManifest = JSON.parse(await readFile(path.join(docs, "package.json"), "utf8"))
const revision = `${docsManifest.devDependencies["@palamedes/source"]}\n${archive}`
let previousRevision
try {
  previousRevision = await readFile(path.join(source, ".source-revision"), "utf8")
} catch (error) {
  if (error.code !== "ENOENT") throw error
}
if (revision !== previousRevision) {
  await rm(source, { recursive: true, force: true })
  await cp(archive, source, {
    recursive: true,
    filter: (file) => !["node_modules", "dist", "target"].includes(path.basename(file)),
  })
  await writeFile(path.join(source, ".source-revision"), revision)
}
await access(path.join(source, "Cargo.toml"))

// pnpm owns the pinned source archive and all build dependencies in one lockfile.
// Until V2 is published, build the JS wrappers and native sidecars together.
const manifest = JSON.parse(await readFile(path.join(docs, "package.json"), "utf8"))
const modules = path.join(source, "node_modules")
await mkdir(modules, { recursive: true })
async function link(target, destination) {
  await mkdir(path.dirname(destination), { recursive: true })
  try {
    await symlink(target, destination, process.platform === "win32" ? "junction" : "dir")
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    if ((await realpath(destination)) !== (await realpath(target)))
      throw new Error(`Unexpected dependency link: ${destination}`)
  }
}
await link(path.join(source, "packages"), path.join(modules, "@palamedes"))
for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
  if (!name.startsWith("@palamedes/"))
    await link(path.join(docs, "node_modules", name), path.join(modules, name))
}
function run(script, directory) {
  const result = spawnSync(process.execPath, [script], { cwd: directory, stdio: "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
for (const name of await readdir(path.join(source, "packages"))) {
  if (name.startsWith("core-node-") || name.startsWith("cli-")) {
    const directory = path.join(source, "packages", name)
    const native = name.startsWith("cli-") ? "cli" : "core-node"
    const result = spawnSync(
      process.execPath,
      [path.join(source, "packages", native, "scripts/build-native.mjs"), "--if-compatible"],
      { cwd: directory, stdio: "inherit" }
    )
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}
for (const name of [
  "core",
  "config",
  "core-node",
  "runtime",
  "react",
  "transform",
  "vite-plugin",
]) {
  run(path.join(docs, "node_modules/unbuild/dist/cli.mjs"), path.join(source, "packages", name))
}
run(path.join(source, "packages/cli/scripts/build.mjs"), path.join(source, "packages/cli"))
