/**
 * Serve an overlay fixture for browser tests: copy Basic and the overlay into a temporary project,
 * as the integration tests do, then run `ardo dev` or `ardo build` and `ardo preview` there.
 * Usage: node tests/e2e/examples/serve-fixture.ts <fixture> <dev|preview> <port>
 */
import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"

import { createTestProject } from "../../integration/examples/project.ts"

const [fixture, mode, port, ...options] = process.argv.slice(2)
if (fixture == null || (mode !== "dev" && mode !== "preview") || port == null)
  throw new Error("Usage: serve-fixture.ts <fixture> <dev|preview> <port>")

const directory = createTestProject(fixture, { replaceRoutes: options.includes("replace-routes") })
if (options.includes("default-root")) fs.rmSync(`${directory}/app/root.tsx`)
const ardo = (args: string[]) => ["--config.verifyDepsBeforeRun=false", "exec", "ardo", ...args]
if (mode === "preview") execFileSync("pnpm", ardo(["build"]), { cwd: directory, stdio: "inherit" })
const server = spawn("pnpm", ardo([mode, "--host", "127.0.0.1", "--port", port, "--strictPort"]), {
  cwd: directory,
  stdio: "inherit",
})
const stop = () => server.kill("SIGTERM")
process.once("SIGINT", stop)
process.once("SIGTERM", stop)
server.once("exit", (code) => {
  fs.rmSync(directory, { recursive: true, force: true })
  process.exit(code ?? 0)
})
