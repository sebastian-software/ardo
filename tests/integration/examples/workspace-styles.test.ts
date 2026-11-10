import { readFileSync, readdirSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, beforeEach, expect, it } from "vitest"

import { repositoryRoot } from "./project"
import { createWorkspaceStylesProject } from "./workspace-styles-project"

const framework = path.join(repositoryRoot, "packages/ardo")
const ardoRequire = createRequire(path.join(framework, "package.json"))
const { ardo } = await import(pathToFileURL(path.join(framework, "dist/vite/index.js")).href)
const { build, createServer } = ardoRequire("vite")
let project: ReturnType<typeof createWorkspaceStylesProject>

beforeEach(() => {
  project = createWorkspaceStylesProject()
})
afterEach(() => rmSync(project.parent, { recursive: true, force: true }))

function config() {
  const names = ["ardo:project-boundary", "ardo:managed-runtime", "vite-plugin-vanilla-extract"]
  return {
    root: project.root,
    configFile: false,
    plugins: ardo({ routes: false, icons: false }).filter((plugin) => names.includes(plugin.name)),
    logLevel: "silent",
    environments: { ssr: { optimizeDeps: {} } },
    build: { outDir: "build", minify: false, cssMinify: false, modulePreload: { polyfill: false } },
  }
}

it("builds Vanilla Extract CSS lifted from a transitive workspace package", async () => {
  await build(config())
  const assets = path.join(project.root, "build/assets")
  const css = readdirSync(assets)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(path.join(assets, file), "utf8"))
    .join("\n")
  expect(css).toContain(":root")
  expect(css).toContain("rgb(23, 45, 67)")
  expect(css).toContain("#counter")
})

it("serves generated transitive workspace CSS while rejecting direct transitive source imports", async () => {
  const server = await createServer({ ...config(), server: { middlewareMode: true, watch: null } })
  try {
    const transformed = await server.transformRequest("/app.css.ts")
    const styles = [
      ...(transformed?.code ?? "").matchAll(/import\s*["']([^"']+\.vanilla\.css[^"']*)["']/gu),
    ]
    const tokenStyle = styles.find((match) => match[1]?.includes(project.tokens))?.[1]
    expect(tokenStyle).toBeDefined()
    expect((await server.transformRequest(tokenStyle!))?.code).toContain("rgb(23, 45, 67)")
    await expect(
      server.environments.client.pluginContainer.resolveId(
        path.join(project.tokens, "index.ts"),
        path.join(project.root, "entry.js")
      )
    ).rejects.toThrow(/Undeclared application dependency "tokens"/u)
  } finally {
    await server.close()
  }
})
