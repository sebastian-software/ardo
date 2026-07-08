import type { Config } from "@react-router/dev/config"

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { resolveConfig } from "vite"
import { describe, expect, it, vi } from "vitest"

import { flattenGitHubPagesBuildOutput, withArdoGitHubPages } from "./flatten-plugin"

type BuildEnd = NonNullable<Config["buildEnd"]>
type BuildEndArgs = Parameters<BuildEnd>[0]
type ExitListener = (code: number) => void

describe("flattenGitHubPagesBuildOutput", () => {
  it("flattens from the resolved React Router client build directory", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ardo-flatten-"))
    try {
      const root = path.join(tmpDir, "project")
      const buildDir = path.join(root, "custom-build", "client")
      await mkdir(path.join(buildDir, "docs"), { recursive: true })
      await writeFile(path.join(buildDir, "docs", "index.html"), "nested", "utf8")

      flattenGitHubPagesBuildOutput(
        await createBuildEndArgs({ basename: "/docs/", buildDirectory: "custom-build", root })
      )

      await expect(readFile(path.join(buildDir, "index.html"), "utf8")).resolves.toBe("nested")
      await expect(readFile(path.join(buildDir, "docs", "index.html"), "utf8")).rejects.toThrow(
        "ENOENT"
      )
    } finally {
      await rm(tmpDir, { force: true, recursive: true })
    }
  })
})

describe("withArdoGitHubPages", () => {
  it("sets the GitHub Pages basename and flattens after an existing buildEnd hook", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ardo-build-end-"))
    let exitListener: ExitListener | undefined
    const processOnce = captureProcessExitListener((listener) => {
      exitListener = listener
    })

    try {
      const root = path.join(tmpDir, "project")
      const buildDir = path.join(root, "build", "client")
      await mkdir(path.join(buildDir, "repo"), { recursive: true })
      await writeFile(path.join(buildDir, "repo", "index.html"), "nested", "utf8")
      const userBuildEnd = vi.fn<BuildEnd>()

      const config = withArdoGitHubPages(
        {
          ssr: false,
          prerender: true,
          buildEnd: userBuildEnd,
        },
        { basename: "/repo/" }
      )

      expect(config.basename).toBe("/repo/")

      const args = await createBuildEndArgs({ basename: "/repo/", buildDirectory: "build", root })
      await config.buildEnd(args)

      expect(userBuildEnd).toHaveBeenCalledWith(args)
      await expect(readFile(path.join(buildDir, "repo", "index.html"), "utf8")).resolves.toBe(
        "nested"
      )
      expect(processOnce).toHaveBeenCalledWith("exit", expect.any(Function))
      expect(exitListener).toBeDefined()

      exitListener?.(0)

      await expect(readFile(path.join(buildDir, "index.html"), "utf8")).resolves.toBe("nested")
      await expect(readFile(path.join(buildDir, "repo", "index.html"), "utf8")).rejects.toThrow(
        "ENOENT"
      )
    } finally {
      processOnce.mockRestore()
      await rm(tmpDir, { force: true, recursive: true })
    }
  })

  it("lets the explicit options basename override the wrapped config basename", () => {
    const config = withArdoGitHubPages(
      {
        basename: "/old/",
        ssr: false,
      },
      { basename: "/new/" }
    )

    expect(config.basename).toBe("/new/")
  })

  it("marks the process as failed when deferred flattening throws", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "ardo-build-end-failure-"))
    let exitListener: ExitListener | undefined
    const previousExitCode = process.exitCode
    const processOnce = captureProcessExitListener((listener) => {
      exitListener = listener
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    try {
      process.exitCode = undefined
      const root = path.join(tmpDir, "project")
      const buildDir = path.join(root, "build", "client")
      await mkdir(buildDir, { recursive: true })
      await writeFile(path.join(buildDir, "repo"), "not a directory", "utf8")

      const config = withArdoGitHubPages(
        {
          ssr: false,
        },
        { basename: "/repo/" }
      )

      await config.buildEnd(
        await createBuildEndArgs({ basename: "/repo/", buildDirectory: "build", root })
      )

      expect(exitListener).toBeDefined()
      exitListener?.(0)

      expect(process.exitCode).toBe(1)
      expect(consoleError).toHaveBeenCalledWith(
        "[ardo] Failed to flatten GitHub Pages build output."
      )
    } finally {
      process.exitCode = previousExitCode
      consoleError.mockRestore()
      processOnce.mockRestore()
      await rm(tmpDir, { force: true, recursive: true })
    }
  })
})

function captureProcessExitListener(onListener: (listener: ExitListener) => void) {
  const mockOnce = (event: string | symbol, listener: (...args: unknown[]) => void) => {
    expect(event).toBe("exit")
    onListener((code) => {
      listener(code)
    })
    return process
  }

  return vi.spyOn(process, "once").mockImplementation(mockOnce as typeof process.once)
}

async function createBuildEndArgs(input: {
  basename: string
  buildDirectory: string
  root: string
}): Promise<BuildEndArgs> {
  return {
    buildManifest: undefined,
    reactRouterConfig: {
      allowedActionOrigins: false,
      appDirectory: path.join(input.root, "app"),
      basename: input.basename,
      buildDirectory: input.buildDirectory,
      future: {
        unstable_optimizeDeps: false,
      },
      prerender: true,
      routeDiscovery: {
        mode: "lazy",
        manifestPath: "/__manifest",
      },
      routes: {},
      serverBuildFile: "index.js",
      serverModuleFormat: "esm",
      splitRouteModules: true,
      ssr: false,
      subResourceIntegrity: false,
      unstable_routeConfig: [],
    },
    viteConfig: await resolveConfig({ root: input.root }, "build"),
  }
}
