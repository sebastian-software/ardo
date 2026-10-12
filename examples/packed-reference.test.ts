import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const examplesDir = import.meta.dirname
const packageDir = path.resolve(examplesDir, "../packages/ardo")

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
    (reference) => {
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
        expect(fs.existsSync(path.join(consumer, "node_modules/@typescript/native"))).toBe(false)
        expect(fs.existsSync(path.join(consumer, "node_modules/oxc-parser"))).toBe(false)
      }
    },
    300_000
  )
})
