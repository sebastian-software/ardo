import { cpSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { isBuiltin } from "node:module"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { ardo } from "ardo/vite"
import { build, type UserConfig } from "vite"
import { expect, it } from "vitest"

it("renders Lucide with the consumer React when an ancestor has another copy", async () => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "ardo-ssr-resolution-"))
  const consumer = path.join(parent, "worktree")
  const packageModules = path.resolve(import.meta.dirname, "../../packages/ardo/node_modules")
  try {
    // Lucide is installed only in the ancestor, with a separate React instance.
    mkdirSync(path.join(parent, "node_modules"), { recursive: true })
    mkdirSync(path.join(consumer, "node_modules"), { recursive: true })
    for (const name of ["lucide-react", "react"]) {
      cpSync(
        realpathSync(path.join(packageModules, name)),
        path.join(parent, "node_modules", name),
        {
          recursive: true,
        }
      )
    }
    for (const name of ["react", "react-dom"]) {
      cpSync(
        realpathSync(path.join(packageModules, name)),
        path.join(consumer, "node_modules", name),
        {
          recursive: true,
        }
      )
    }
    writeFileSync(
      path.join(consumer, "package.json"),
      JSON.stringify({
        type: "module",
        dependencies: {
          react: "19",
          "react-dom": "19",
          "lucide-react": "1",
          "docs-widget": "1",
        },
      })
    )
    const widget = path.join(consumer, "node_modules/docs-widget")
    mkdirSync(widget)
    writeFileSync(
      path.join(widget, "package.json"),
      JSON.stringify({
        name: "docs-widget",
        type: "module",
        exports: "./index.js",
        peerDependencies: { react: "19" },
      })
    )
    writeFileSync(
      path.join(widget, "index.js"),
      'import { createContext, createElement, useContext } from "react";\n' +
        'const Context = createContext("owned");\n' +
        'export function Widget() { return createElement("span", { className: "docs-widget" }, useContext(Context)); }\n'
    )
    writeFileSync(
      path.join(consumer, "entry.mjs"),
      'import { createElement } from "react";\n' +
        'import { renderToStaticMarkup } from "react-dom/server";\n' +
        'import { Monitor } from "lucide-react";\n' +
        'import { Widget } from "docs-widget";\n' +
        'export const Component = () => createElement("section", null, createElement(Monitor), createElement(Widget));\n' +
        "export const html = renderToStaticMarkup(createElement(Component));\n"
    )
    const plugin = ardo({ title: "SSR fixture", githubPages: false }).find(
      (entry) => entry.name === "ardo"
    )
    if (plugin == null || typeof plugin.config !== "function") {
      throw new Error("Ardo configuration hook is unavailable")
    }
    const config = (await plugin.config.call(
      {} as never,
      { root: consumer },
      { command: "build", mode: "production" }
    )) as UserConfig
    await build({
      ...config,
      configFile: false,
      root: consumer,
      logLevel: "silent",
      ssr: { noExternal: ["ardo"] },
      build: { ssr: path.join(consumer, "entry.mjs"), outDir: "before", minify: false },
    })
    await expect(
      import(pathToFileURL(path.join(consumer, "before/entry.js")).href)
    ).rejects.toThrow(/useContext/)

    const boundary = ardo({ routes: false, icons: false }).find(
      (entry) => entry.name === "ardo:project-boundary"
    )
    if (boundary == null) throw new Error("Ardo package boundary is unavailable")
    const isolated: UserConfig = {
      ...config,
      configFile: false,
      root: consumer,
      plugins: [boundary],
      logLevel: "silent",
      build: { ssr: path.join(consumer, "entry.mjs"), outDir: "build", minify: false },
    }
    await expect(build(isolated)).rejects.toThrow(/not installed.*node_modules/u)
    cpSync(
      realpathSync(path.join(packageModules, "lucide-react")),
      path.join(consumer, "node_modules/lucide-react"),
      { recursive: true }
    )
    const bundle = await build(isolated)
    if (Array.isArray(bundle) || !("output" in bundle)) {
      throw new Error("Expected a single SSR bundle")
    }
    const imports = bundle.output.flatMap((entry) =>
      entry.type === "chunk" ? [...entry.imports, ...entry.dynamicImports] : []
    )
    expect(imports.every((id) => isBuiltin(id))).toBe(true)
    const output = await import(pathToFileURL(path.join(consumer, "build/entry.js")).href)
    expect(output.html).toContain("<svg")
    expect(output.html).toContain("lucide-monitor")
    expect(output.html).toContain("docs-widget")
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}, 30_000)
