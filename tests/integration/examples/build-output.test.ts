import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { assertPreviewSSR } from "./dev-server"
import { createTestProject } from "./project"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

function project(): string {
  const directory = fs.realpathSync(createTestProject())
  directories.push(directory)
  return directory
}

function build(directory: string, args: string[] = []): void {
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build", ...args], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
}

function configure(directory: string, options: Record<string, unknown>): void {
  fs.writeFileSync(
    path.join(directory, "ardo.config.ts"),
    `import { defineArdoConfig } from "ardo/config";
export default defineArdoConfig(${JSON.stringify({ title: "Output regression", ...options })});
`
  )
}

describe("real CLI build output and preview", () => {
  it("preserves explicit output files and still cleans the default build", () => {
    const directory = project()
    build(directory)
    const clientSentinel = path.join(directory, "build/client/retained.txt")
    const serverSentinel = path.join(directory, "build/server/retained.txt")
    fs.writeFileSync(clientSentinel, "client-owned")
    fs.writeFileSync(serverSentinel, "server-owned")
    build(directory, ["--no-emptyOutDir"])
    expect(fs.readFileSync(clientSentinel, "utf8")).toBe("client-owned")
    expect(fs.readFileSync(serverSentinel, "utf8")).toBe("server-owned")

    fs.writeFileSync(
      path.join(directory, "vite.config.ts"),
      `import { defineConfig } from "ardo/vite";
export default defineConfig({ environments: {
  client: { build: { emptyOutDir: false } }, ssr: { build: { emptyOutDir: true } }
} });
`
    )
    build(directory, ["--no-emptyOutDir"])
    expect(fs.existsSync(clientSentinel)).toBe(true)
    expect(fs.existsSync(serverSentinel)).toBe(false)
    fs.rmSync(path.join(directory, "vite.config.ts"))
    build(directory)
    expect(fs.existsSync(clientSentinel)).toBe(false)
    expect(fs.existsSync(serverSentinel)).toBe(false)
  })

  it.each([false, true])(
    "previews a versioned home with locale=%s and no root redirect",
    async (localized) => {
      const directory = project()
      if (localized) {
        const original = path.join(directory, "app/routes")
        const saved = path.join(directory, "app/localized-routes")
        fs.renameSync(original, saved)
        fs.mkdirSync(original)
        fs.renameSync(saved, path.join(original, "en"))
        const localizedHome = path.join(original, "en/home.tsx")
        fs.writeFileSync(
          localizedHome,
          fs.readFileSync(localizedHome, "utf8").replace('"../Counter"', '"../../Counter"')
        )
      }
      // Legacy Vite output settings must not override Ardo's configured build directory in preview.
      fs.writeFileSync(
        path.join(directory, "vite.config.ts"),
        `import { defineConfig } from "ardo/vite";
export default defineConfig({ build: { outDir: "legacy-dist" } });
`
      )
      configure(directory, {
        base: "/project/",
        outDir: "release/docs",
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }], rootRedirect: false },
        ...(localized ? { i18n: { defaultLocale: "en", locales: [{ id: "en" }] } } : {}),
      })
      build(directory)
      const client = path.join(directory, "release/docs/client")
      const home = path.join(client, "v6", localized ? "en" : "", "index.html")
      expect(fs.existsSync(path.join(directory, "build/client"))).toBe(false)
      expect(fs.existsSync(path.join(client, "index.html"))).toBe(false)
      expect(fs.existsSync(home)).toBe(true)
      const assetSentinel = path.join(client, "v6/assets/retained.txt")
      fs.writeFileSync(assetSentinel, "version-owned")
      build(directory, ["--no-emptyOutDir"])
      expect(fs.readFileSync(assetSentinel, "utf8")).toBe("version-owned")
      await assertPreviewSSR(directory, `/project/v6/${localized ? "en/" : ""}`)
      if (!localized) {
        await assertPreviewSSR(directory, "/project/v6/", [
          "--outDir",
          "release/docs/client/v6",
          "--base",
          "/project/v6/",
        ])
      }
      const rootPage = fs.readFileSync(home)
      fs.rmSync(home)
      fs.writeFileSync(path.join(client, "index.html"), rootPage)
      await assertPreviewSSR(directory, "/project/")
      fs.rmSync(path.join(client, "index.html"))

      fs.mkdirSync(path.join(client, "unrelated"))
      fs.writeFileSync(path.join(client, "unrelated/index.html"), "unrelated document")
      const missingHome = spawnSync(
        "pnpm",
        ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "preview"],
        {
          cwd: directory,
          encoding: "utf8",
          timeout: 15_000,
        }
      )
      expect(missingHome.status).toBe(1)
      expect(missingHome.stderr).toContain(
        `No index.html found for the configured home page at ${home}`
      )
    }
  )
})
