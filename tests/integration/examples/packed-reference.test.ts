import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { basicDirectory, copyProjectSource, fixturesDirectory, repositoryRoot } from "./project"
import { assertDevSSR } from "./dev-server"
import { assertDocRecipes } from "./doc-recipes"

const packageDir = path.join(repositoryRoot, "packages/ardo")

type WorkspaceValue = Record<string, boolean | string> | string[]

/**
 * Writes pnpm-workspace.yaml in block style. pnpm 12 edits this file during
 * install (for example to extend minimumReleaseAgeExclude) and refuses inline
 * flow collections, so a JSON document no longer works. Scalars stay
 * JSON-quoted, which is valid YAML. Empty collections are left out.
 */
function toWorkspaceYaml(config: Record<string, WorkspaceValue>): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(config)) {
    const entries = Array.isArray(value)
      ? value.map((item) => `  - ${JSON.stringify(item)}`)
      : Object.entries(value).map(
          ([name, item]) => `  ${JSON.stringify(name)}: ${JSON.stringify(item)}`
        )
    if (entries.length > 0) lines.push(`${key}:`, ...entries)
  }
  return `${lines.join("\n")}\n`
}

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

function run(cwd: string, args: string[], timeout = 120_000): string {
  const result = spawnSync("pnpm", ["--config.verifyDepsBeforeRun=false", ...args], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    timeout,
    env: { ...process.env, CI: "true" },
  })
  if (result.error != null) throw result.error
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} exited with ${result.status}.\n${output}`)
  }
  return output
}

function manualFile(source: string, file: string, language: string): string {
  const marker = `**\`${file}\`**:`
  const section = source.split(marker)[1]
  const contents = section?.split(`\`\`\`${language}\n`)[1]?.split("```", 1)[0]
  if (contents == null) throw new Error(`Missing manual installation snippet for ${file}`)
  return contents
}

async function assertPackedBasicDevSSRWithoutArdoConfig(consumer: string): Promise<void> {
  const configPath = path.join(consumer, "ardo.config.ts")
  const backupPath = `${configPath}.test-backup`
  if (!fs.existsSync(configPath)) throw new Error("Expected the packed Basic Ardo config")
  fs.renameSync(configPath, backupPath)
  try {
    await assertDevSSR(consumer)
  } finally {
    fs.renameSync(backupPath, configPath)
  }
}

describe("Basic and optional API configuration as packed-package consumers", () => {
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

  it("builds the literal manual setup and feature recipes as a packed-package consumer", () => {
    const guide = fs.readFileSync(
      path.join(repositoryRoot, "docs/app/routes/guide/getting-started.mdx"),
      "utf8"
    )
    const consumer = path.join(temporaryRoot, "manual-installation")
    const files = [
      ["ardo.config.ts", "ts"],
      ["tsconfig.json", "json"],
      ["app/root.tsx", "tsx"],
      ["app/routes/home.tsx", "tsx"],
      ["app/routes/guide/getting-started.mdx", "markdown"],
    ] as const
    for (const [file, language] of files) {
      const destination = path.join(consumer, file)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.writeFileSync(destination, manualFile(guide, file, language))
    }
    const typescript = /pnpm add -D typescript@([^\s]+)/u.exec(guide)?.[1]
    if (typescript == null) throw new Error("Missing manual TypeScript installation command")
    fs.writeFileSync(
      path.join(consumer, "package.json"),
      JSON.stringify({
        name: "ardo-manual-installation-test",
        private: true,
        type: "module",
        scripts: { build: "ardo build" },
        dependencies: { ardo: `file:${tarball}` },
        devDependencies: { typescript },
      })
    )
    fs.writeFileSync(
      path.join(consumer, "pnpm-workspace.yaml"),
      toWorkspaceYaml({
        packages: ["."],
        allowBuilds: { esbuild: true },
        overrides: readEngineOverrides(),
      })
    )

    run(consumer, ["install", "--no-lockfile", "--prefer-offline"], 180_000)
    run(consumer, ["exec", "tsc", "--noEmit"])
    expect(run(consumer, ["build"])).not.toContain("broken internal link")

    const client = path.join(consumer, "build/client")
    const home = fs.readFileSync(path.join(client, "index.html"), "utf8")
    expect(home).toContain("Guides and examples for your project.")
    expect(home).not.toContain("ERROR 404")
    expect(home).toContain('href="/guide/getting-started/"')
    expect(
      fs
        .readFileSync(path.join(client, "guide/getting-started/index.html"), "utf8")
        .replace(/<!--.*?-->/gs, "")
    ).toContain("Welcome to your documentation site!")

    const logo = path.join(consumer, "app/assets/logo.svg")
    fs.mkdirSync(path.dirname(logo), { recursive: true })
    fs.writeFileSync(
      logo,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="blue"/></svg>'
    )
    fs.writeFileSync(
      path.join(consumer, "openapi.yaml"),
      "openapi: 3.1.0\ninfo:\n  title: Pet API\n  version: 1.0.0\npaths: {}\n"
    )
    for (const recipe of ["custom-theme", "openapi"]) {
      const source = fs.readFileSync(
        path.join(repositoryRoot, `docs/app/routes/guide/${recipe}.mdx`),
        "utf8"
      )
      fs.writeFileSync(
        path.join(consumer, "ardo.config.ts"),
        manualFile(source, "ardo.config.ts", "ts")
      )
      run(consumer, ["exec", "tsc", "--noEmit"])
      expect(run(consumer, ["build"])).not.toContain("broken internal link")
    }
    expect(fs.existsSync(path.join(client, "api/index.html"))).toBe(true)
    assertDocRecipes(consumer, run)
  }, 240_000)

  it.each(["basic", "native-api"])(
    "installs, typechecks, and builds the %s reference outside the workspace",
    async (reference) => {
      const source =
        reference === "basic" ? basicDirectory : path.join(fixturesDirectory, reference)
      const consumer = path.join(temporaryRoot, reference)
      copyProjectSource(consumer, reference === "basic" ? undefined : reference)
      const manifestPath = path.join(consumer, "package.json")
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      manifest.dependencies.ardo = `file:${tarball}`
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
      // The pinned TypeScript 7.1 preview is younger than the release-age policy
      // allows, so the consumer excludes it the same way this workspace does.
      const typescriptVersion: unknown = manifest.devDependencies?.typescript
      const compilerVersion =
        typeof typescriptVersion === "string" && typescriptVersion.includes("-dev.")
          ? typescriptVersion
          : undefined
      const compilerPlatforms =
        compilerVersion == null
          ? {}
          : JSON.parse(
              fs.readFileSync(path.join(source, "node_modules/typescript/package.json"), "utf8")
            ).optionalDependencies
      fs.writeFileSync(
        path.join(consumer, "pnpm-workspace.yaml"),
        toWorkspaceYaml({
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

      if (reference === "native-api") {
        const renderer = fs.readFileSync(
          path.join(client, "api-reference/types/documentrenderer/index.html"),
          "utf8"
        )
        expect(renderer).toContain("The document source")
        expect(renderer).toContain("The rendered document")
      } else {
        expect(Object.keys(manifest.dependencies)).toEqual(["ardo"])
        for (const name of ["react", "react-dom", "vite"]) {
          expect(installed.dependencies[name]).toBeDefined()
          expect(installed.peerDependencies[name]).toBeUndefined()
          expect(fs.existsSync(path.join(consumer, "node_modules", name))).toBe(false)
        }
        expect(
          fs.readFileSync(path.join(client, "index.html"), "utf8").replace(/<!--.*?-->/gs, "")
        ).toContain("Count: 0")
        run(consumer, ["exec", "ardo", "--version"])
        // TypeScript stays an optional peer: Ardo never installs it for a Basic site.
        expect(installed.dependencies.typescript).toBeUndefined()
        expect(fs.existsSync(path.join(consumer, "node_modules/oxc-parser"))).toBe(false)
        // Exercise the CLI's generated default wrapper as well as the configured
        // production build above. A Basic project must work without ardo.config.ts.
        await assertPackedBasicDevSSRWithoutArdoConfig(consumer)

        fs.writeFileSync(
          path.join(consumer, "ardo.config.ts"),
          `import { defineArdoConfig } from "ardo/config";

export default defineArdoConfig(({ command, mode }) => ({
  title: \`Packed Basic \${mode}-\${command}\`,
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
        await assertDevSSR(consumer, {
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
