import { execFileSync, spawn, type ChildProcess } from "node:child_process"
import fs from "node:fs"
import { createConnection, createServer } from "node:net"
import os from "node:os"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const examplesDir = import.meta.dirname
const packageDir = path.resolve(examplesDir, "../packages/ardo")
const devHost = "127.0.0.1"

function readEngineOverrides(): Record<string, string> {
  const inputPath = process.env.ARDO_TEST_ENGINE_OVERRIDES
  if (inputPath == null) return {}
  const input: unknown = JSON.parse(fs.readFileSync(inputPath, "utf8"))
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("ARDO_TEST_ENGINE_OVERRIDES must name a JSON object of package overrides")
  }
  const overrides: Record<string, string> = {}
  for (const [name, value] of Object.entries(input)) {
    if (typeof value !== "string") throw new Error(`Invalid local engine override for ${name}`)
    overrides[name] = value
  }
  return overrides
}

function run(cwd: string, args: string[], timeout = 120_000): void {
  try {
    execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", ...args], {
      cwd,
      stdio: "pipe",
      timeout,
      env: { ...process.env, CI: "true" },
    })
  } catch (error) {
    if (error instanceof Error && "stdout" in error && "stderr" in error) {
      throw new Error(
        `${error.message}\n${String(error.stdout ?? "")}\n${String(error.stderr ?? "")}`,
        { cause: error }
      )
    }
    throw error
  }
}

async function getAvailablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, devHost, resolve)
  })
  const address = server.address()
  if (address == null || typeof address === "string") {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    throw new Error("Could not determine a free port for the packed Basic dev smoke test")
  }
  const port = address.port
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error == null ? resolve() : reject(error)))
  })
  return port
}

function isPortReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: devHost, port })
    const finish = (connected: boolean) => {
      socket.destroy()
      resolve(connected)
    }
    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}

async function waitForDevServer(
  child: ChildProcess,
  port: number,
  getOutput: () => string,
  getSpawnError: () => Error | undefined,
  timeoutMs = 90_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const spawnError = getSpawnError()
    if (spawnError != null) throw spawnError
    if (child.exitCode != null || child.signalCode != null) {
      throw new Error(
        `Ardo dev exited before listening (code ${child.exitCode ?? child.signalCode}).\n${getOutput()}`
      )
    }
    if (await isPortReady(port)) return
    await delay(200)
  }
  throw new Error(`Ardo dev did not listen on port ${port} within ${timeoutMs} ms.\n${getOutput()}`)
}

function signalDevServer(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid == null || child.exitCode != null || child.signalCode != null) return
  try {
    if (process.platform === "win32") child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error
  }
}

function waitForChildExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode != null || child.signalCode != null) return Promise.resolve(true)
  return new Promise((resolve) => {
    let timer: NodeJS.Timeout
    const onExit = () => {
      clearTimeout(timer)
      resolve(true)
    }
    timer = setTimeout(() => {
      child.off("exit", onExit)
      resolve(false)
    }, timeoutMs)
    child.once("exit", onExit)
  })
}

async function stopDevServer(child: ChildProcess): Promise<void> {
  if (child.pid == null || child.exitCode != null || child.signalCode != null) return
  signalDevServer(child, "SIGTERM")
  if (await waitForChildExit(child, 5_000)) return
  signalDevServer(child, "SIGKILL")
  if (!(await waitForChildExit(child, 5_000))) {
    throw new Error("Ardo dev process did not stop after SIGKILL")
  }
}

async function assertPackedBasicDevSSR(
  consumer: string,
  expected?: { title?: string; responseHeader?: { name: string; value: string } }
): Promise<void> {
  const port = await getAvailablePort()
  let serverOutput = ""
  let spawnError: Error | undefined
  let failure: unknown
  const child = spawn(
    "pnpm",
    [
      "--config.verifyDepsBeforeRun=false",
      "exec",
      "ardo",
      "dev",
      "--host",
      devHost,
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: consumer,
      detached: process.platform !== "win32",
      env: { ...process.env, CI: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  )
  const appendOutput = (chunk: Buffer) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-12_000)
  }
  child.once("error", (error) => {
    spawnError = error
  })
  child.stdout?.on("data", appendOutput)
  child.stderr?.on("data", appendOutput)

  try {
    await waitForDevServer(
      child,
      port,
      () => serverOutput,
      () => spawnError
    )

    // A TCP readiness probe above avoids consuming the first HTTP request, which
    // must exercise the installed package's initial dev SSR dependency graph.
    const response = await fetch(`http://${devHost}:${port}/`, {
      signal: AbortSignal.timeout(60_000),
    })
    const html = await response.text()
    expect(response.status, `First dev SSR response: ${html.slice(0, 2_000)}`).toBe(200)
    const normalizedHtml = html.replace(/<!--.*?-->/gs, "")
    expect(normalizedHtml).toContain('data-testid="runtime-counter"')
    expect(normalizedHtml).toContain("Count: 0")
    if (expected?.title != null) expect(normalizedHtml).toContain(expected.title)
    if (expected?.responseHeader != null) {
      expect(response.headers.get(expected.responseHeader.name)).toBe(expected.responseHeader.value)
    }
  } catch (error) {
    failure = error
  } finally {
    await stopDevServer(child)
  }

  if (failure != null) {
    throw new Error(
      [
        failure instanceof Error ? (failure.stack ?? failure.message) : String(failure),
        serverOutput.length === 0 ? "" : `Ardo dev output (tail):\n${serverOutput}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      { cause: failure }
    )
  }
}

async function assertPackedBasicDevSSRWithoutArdoConfig(consumer: string): Promise<void> {
  const configPath = path.join(consumer, "ardo.config.ts")
  const backupPath = `${configPath}.test-backup`
  if (!fs.existsSync(configPath)) throw new Error("Expected the packed Basic Ardo config")
  fs.renameSync(configPath, backupPath)
  try {
    await assertPackedBasicDevSSR(consumer)
  } finally {
    fs.renameSync(backupPath, configPath)
  }
}

describe("reference projects as packed-package consumers", () => {
  let temporaryRoot: string
  let tarball: string

  beforeAll(() => {
    temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-reference-"))
    const packDir = path.join(temporaryRoot, "packages")
    fs.mkdirSync(packDir)
    run(packageDir, ["pack", "--pack-destination", packDir])
    const archive = fs.readdirSync(packDir).find((file) => file.endsWith(".tgz"))
    if (archive == null) throw new Error("Ardo package tarball was not created")
    tarball = path.join(packDir, archive)
  }, 180_000)

  afterAll(() => {
    if (temporaryRoot != null) fs.rmSync(temporaryRoot, { recursive: true, force: true })
  })

  it.each(["basic", "library"])(
    "installs, typechecks, and builds the %s reference outside the workspace",
    async (reference) => {
      const source = path.join(examplesDir, reference)
      const consumer = path.join(temporaryRoot, reference)
      const excluded = new Set([
        "node_modules",
        "build",
        ".react-router",
        ".api-declarations",
        "app/routes.ts",
        "app/routes/api-reference",
      ])
      fs.cpSync(source, consumer, {
        recursive: true,
        filter: (file) => !excluded.has(path.relative(source, file)) && !file.endsWith(".test.ts"),
      })
      const manifestPath = path.join(consumer, "package.json")
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      manifest.dependencies.ardo = `file:${tarball}`
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
      const compilerVersion = manifest.devDependencies["@typescript/native"]?.replace(
        "npm:typescript@",
        ""
      )
      const compilerPlatforms =
        compilerVersion == null
          ? {}
          : JSON.parse(
              fs.readFileSync(
                path.join(source, "node_modules/@typescript/native/package.json"),
                "utf8"
              )
            ).optionalDependencies
      fs.writeFileSync(
        path.join(consumer, "pnpm-workspace.yaml"),
        JSON.stringify({
          packages: ["."],
          allowBuilds: { esbuild: true },
          overrides: readEngineOverrides(),
          minimumReleaseAgeExclude:
            compilerVersion == null
              ? []
              : [
                  `typescript@${compilerVersion}`,
                  ...Object.entries(compilerPlatforms).map(
                    ([name, version]) => `${name}@${String(version)}`
                  ),
                ],
        })
      )

      run(consumer, ["install", "--no-lockfile", "--prefer-offline"], 180_000)
      run(consumer, ["exec", "tsc", "--noEmit"])
      run(consumer, ["build"])

      const client = path.join(consumer, "build/client")
      expect(fs.readFileSync(path.join(client, "index.html"), "utf8")).toContain("<!DOCTYPE html>")
      expect(fs.existsSync(path.join(client, "guide/getting-started/index.html"))).toBe(true)
      const installed = JSON.parse(
        fs.readFileSync(path.join(consumer, "node_modules/ardo/package.json"), "utf8")
      )
      expect(installed.dependencies.typedoc).toBeUndefined()
      expect(installed.exports["./typedoc"]).toBeUndefined()
      expect(fs.existsSync(path.join(consumer, "node_modules/typedoc"))).toBe(false)

      if (reference === "library") {
        const renderer = fs.readFileSync(
          path.join(client, "api-reference/types/documentrenderer/index.html"),
          "utf8"
        )
        expect(renderer).toContain("The document source")
        expect(renderer).toContain("The rendered document")
      } else {
        expect(Object.keys(manifest.dependencies)).toEqual(["ardo"])
        for (const name of [
          "react",
          "react-dom",
          "react-router",
          "@react-router/dev",
          "vite",
          "lucide-react",
        ]) {
          expect(installed.dependencies[name]).toBeDefined()
          expect(installed.peerDependencies[name]).toBeUndefined()
          expect(fs.existsSync(path.join(consumer, "node_modules", name))).toBe(false)
        }
        expect(fs.readFileSync(path.join(client, "index.html"), "utf8")).toContain(
          "runtime-counter"
        )
        run(consumer, ["exec", "ardo", "--version"])
        expect(fs.existsSync(path.join(consumer, "node_modules/@typescript/native"))).toBe(false)
        expect(fs.existsSync(path.join(consumer, "node_modules/oxc-parser"))).toBe(false)
        // Exercise the CLI's generated default wrapper as well as the configured
        // production build above. A Basic project must work without ardo.config.ts.
        await assertPackedBasicDevSSRWithoutArdoConfig(consumer)

        fs.writeFileSync(
          path.join(consumer, "ardo.config.ts"),
          `import { defineArdoConfig } from "ardo/config";

export default defineArdoConfig(({ command, mode }) => ({
  title: \`Packed Basic \${mode}-\${command}\`,
  githubPages: false,
}));
`
        )
        fs.writeFileSync(
          path.join(consumer, "vite.config.ts"),
          `import { defineConfig } from "ardo/vite";

export default defineConfig(({ command, mode }) => ({
  plugins: [{
    name: "packed-basic-config-header",
    configureServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("x-ardo-config", \`\${mode}-\${command}\`);
        next();
      });
    },
  }],
}));
`
        )

        run(consumer, ["exec", "tsc", "--noEmit"])
        const devConfigIdentity = "development-serve"
        await assertPackedBasicDevSSR(consumer, {
          title: `Packed Basic ${devConfigIdentity}`,
          responseHeader: { name: "x-ardo-config", value: devConfigIdentity },
        })

        run(consumer, ["build"])
        const configuredBuildHtml = fs.readFileSync(path.join(client, "index.html"), "utf8")
        expect(configuredBuildHtml).toContain("Packed Basic production-build")
      }
    },
    420_000
  )
})
