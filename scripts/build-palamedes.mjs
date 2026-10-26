import { spawnSync } from "node:child_process"
import { access } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const source = fileURLToPath(new URL("../docs/vendor/palamedes/", import.meta.url))
try {
  await access(new URL("../docs/vendor/palamedes/Cargo.toml", import.meta.url))
} catch {
  throw new Error(
    "Palamedes source is missing. Run git submodule update --init docs/vendor/palamedes, then pnpm build."
  )
}

// Keep Palamedes in its own workspace, with its own lockfile and toolchain.
// Native platform packages and JS wrappers must come from the same Git revision.
const filters = [
  "--filter",
  "@palamedes/react...",
  "--filter",
  "@palamedes/vite-plugin...",
  "--filter",
  "@palamedes/cli...",
]
for (const args of [
  ["install", "--frozen-lockfile", ...filters, "--filter", "palamedes"],
  ["--config.verifyDepsBeforeRun=false", ...filters, "--workspace-concurrency=1", "build"],
]) {
  const result = spawnSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, {
    cwd: source,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
