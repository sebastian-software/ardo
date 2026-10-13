import type { InlineConfig } from "vite"

import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { CliUsageError, parsePreviewArguments, startPreview } from "./preview"

describe("Ardo preview CLI", () => {
  it("parses a root, optional host/open values, and common Vite preview flags", () => {
    expect(
      parsePreviewArguments([
        "./site",
        "--host",
        "0.0.0.0",
        "--port",
        "4174",
        "--strictPort",
        "--open",
        "/docs/",
        "-c=vite.preview.config.ts",
      ])
    ).toStrictEqual({
      root: "./site",
      host: "0.0.0.0",
      port: 4174,
      strictPort: true,
      open: "/docs/",
      config: "vite.preview.config.ts",
      mode: undefined,
      base: undefined,
      outDir: undefined,
    })

    expect(parsePreviewArguments(["--host", "--open"])).toMatchObject({ host: true, open: true })
    expect(parsePreviewArguments(["--host", "--", "--open"])).toMatchObject({
      host: true,
      root: "--open",
      open: undefined,
    })
  })

  it("rejects invalid ports and unknown options as usage errors", () => {
    expect(() => parsePreviewArguments(["--port", "nope"])).toThrow(CliUsageError)
    expect(() => parsePreviewArguments(["--unknown"])).toThrow(CliUsageError)
  })

  it("uses the configured React Router client directory, base, and preview defaults", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-preview-"))
    const clientDirectory = path.join(root, "release", "website", "client")
    const wrapperPath = path.join(root, ".ardo", "vite.config.mjs")
    const contextPath = path.join(root, "config-context.json")
    let launchConfig: InlineConfig | undefined
    let urlsPrinted = false
    let shortcutsBound = false
    let preparedProject: { root: string; config?: string } | undefined

    try {
      await mkdir(clientDirectory, { recursive: true })
      await mkdir(path.dirname(wrapperPath), { recursive: true })
      await writeFile(
        path.join(root, "vite.config.mjs"),
        `import { writeFileSync } from "node:fs"
        export default ({ command, mode, isPreview }) => {
          writeFileSync(${JSON.stringify(contextPath)}, JSON.stringify({ command, mode, isPreview }))
          return {
            base: "/docs/",
            environments: { client: { build: { outDir: "release/website/client" } } },
            preview: {
              host: "127.0.0.1",
              port: 0,
              headers: { "x-ardo-preview": "config-value" }
            }
          }
        }`
      )
      await writeFile(wrapperPath, `export { default } from "../vite.config.mjs"`)
      await writeFile(
        path.join(clientDirectory, "index.html"),
        "<!doctype html><title>preview fixture</title>"
      )

      const startServer = (config: InlineConfig) => {
        launchConfig = config
        return {
          printUrls() {
            urlsPrinted = true
          },
          bindCLIShortcuts(options: { print: boolean }) {
            expect(options).toStrictEqual({ print: true })
            shortcutsBound = true
          },
        }
      }
      await startPreview(["--config", "vite.config.mjs"], root, {
        startServer,
        prepareProjectConfig(projectRoot, explicitVitePath) {
          preparedProject = { root: projectRoot, config: explicitVitePath }
          return wrapperPath
        },
      })

      expect(launchConfig).toMatchObject({
        configFile: wrapperPath,
        build: { outDir: await realpath(clientDirectory) },
        preview: {
          host: "127.0.0.1",
          port: 0,
          headers: { "x-ardo-preview": "config-value" },
        },
      })
      expect(launchConfig?.base).toBeUndefined()
      expect(preparedProject).toStrictEqual({
        root: path.resolve(root),
        config: path.resolve(root, "vite.config.mjs"),
      })
      expect(JSON.parse(await readFile(contextPath, "utf8"))).toStrictEqual({
        command: "serve",
        mode: "production",
        isPreview: true,
      })
      expect(urlsPrinted).toBe(true)
      expect(shortcutsBound).toBe(true)

      await startPreview(
        [
          "--config=vite.config.mjs",
          "--mode",
          "test-preview",
          "--base",
          "/manual/",
          "--host",
          "0.0.0.0",
          "--port",
          "4176",
        ],
        root,
        {
          startServer,
          prepareProjectConfig: () => wrapperPath,
        }
      )
      expect(launchConfig).toMatchObject({
        configFile: wrapperPath,
        mode: "test-preview",
        base: "/manual/",
        preview: {
          host: "0.0.0.0",
          port: 4176,
          headers: { "x-ardo-preview": "config-value" },
        },
      })
      expect(JSON.parse(await readFile(contextPath, "utf8"))).toStrictEqual({
        command: "serve",
        mode: "test-preview",
        isPreview: true,
      })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("reports a missing client build before starting the preview server", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-preview-missing-"))

    try {
      await writeFile(path.join(root, "vite.config.mjs"), `export default { base: "/docs/" }`)
      await expect(
        startPreview([], root, {
          prepareProjectConfig: () => path.join(root, "vite.config.mjs"),
        })
      ).rejects.toThrow('Run "ardo build" before "ardo preview".')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
