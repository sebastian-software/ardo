import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire, isBuiltin } from "node:module"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { ardo } from "ardo/vite"
import { expect, it } from "vitest"

const appRequire = createRequire(import.meta.url)
const ardoRequire = createRequire(appRequire.resolve("ardo/package.json"))
const { build } = ardoRequire("vite")

it("keeps app, Ardo UI, widgets, and SSR on Ardo's React despite consumer and ancestor copies", async () => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "ardo-ssr-resolution-"))
  const consumer = path.join(parent, "worktree")
  const ardoRoot = realpathSync(path.resolve(import.meta.dirname, "../../packages/ardo"))
  const ardoModules = path.join(ardoRoot, "node_modules")
  const ancestorModules = path.join(parent, "node_modules")
  const consumerModules = path.join(consumer, "node_modules")

  try {
    mkdirSync(ancestorModules, { recursive: true })
    mkdirSync(consumerModules, { recursive: true })
    symlinkSync(ardoRoot, path.join(consumerModules, "ardo"), "dir")

    // The app's dependency tree contains independent React copies. A managed
    // runtime resolver must route both widgets' bare imports back to Ardo.
    const reactPackage = realpathSync(path.join(ardoModules, "react"))
    cpSync(reactPackage, path.join(ancestorModules, "react"), { recursive: true })
    cpSync(reactPackage, path.join(consumerModules, "react"), { recursive: true })

    writeFileSync(
      path.join(consumer, "package.json"),
      JSON.stringify({
        type: "module",
        dependencies: {
          ardo: "workspace:*",
          "ancestor-widget": "1",
          "docs-widget": "1",
        },
      })
    )

    const widgetSource = `import { createElement, useContext } from "react";

export function Widget({ context, className }) {
  return createElement("span", { className }, useContext(context));
}
`
    const docsWidget = path.join(consumerModules, "docs-widget")
    mkdirSync(docsWidget)
    writeFileSync(
      path.join(docsWidget, "package.json"),
      JSON.stringify({
        name: "docs-widget",
        type: "module",
        exports: "./index.js",
        peerDependencies: { react: "19" },
      })
    )
    writeFileSync(path.join(docsWidget, "index.js"), widgetSource)

    const ancestorWidget = path.join(ancestorModules, "ancestor-widget")
    mkdirSync(ancestorWidget)
    writeFileSync(
      path.join(ancestorWidget, "package.json"),
      JSON.stringify({
        name: "ancestor-widget",
        type: "module",
        exports: "./index.js",
        peerDependencies: { react: "19" },
      })
    )
    writeFileSync(path.join(ancestorWidget, "index.js"), widgetSource)
    symlinkSync(ancestorWidget, path.join(consumerModules, "ancestor-widget"), "dir")

    writeFileSync(
      path.join(consumer, "entry.mjs"),
      `import { createContext, createElement } from "ardo/react";
import { renderToStaticMarkup } from "ardo/react-dom/server";
import { ArdoFeatureCard, ArdoThemeToggle } from "ardo/ui";
import { Widget as ConsumerWidget } from "docs-widget";
import { Widget as AncestorWidget } from "ancestor-widget";

const Context = createContext("outside");

export const Component = () =>
  createElement(
    Context.Provider,
    { value: "shared-runtime" },
    createElement(
      "section",
      null,
      createElement(ArdoFeatureCard, { title: "Ardo UI" }, "Framework component"),
      createElement(ArdoThemeToggle),
      createElement(ConsumerWidget, { context: Context, className: "docs-widget" }),
      createElement(AncestorWidget, { context: Context, className: "ancestor-widget" })
    )
  );

export const html = renderToStaticMarkup(createElement(Component));
`
    )

    const plugins = ardo({ routes: false, icons: false })
    const main = plugins.find((plugin) => plugin.name === "ardo")
    const boundary = plugins.find((plugin) => plugin.name === "ardo:project-boundary")
    const managedRuntime = plugins.find((plugin) => plugin.name === "ardo:managed-runtime")
    if (main == null || boundary == null || managedRuntime == null) {
      throw new Error("Ardo runtime plugins are unavailable")
    }

    const config = (pluginList: Array<(typeof plugins)[number]>, outDir: string) => ({
      configFile: false,
      root: consumer,
      plugins: pluginList,
      logLevel: "silent" as const,
      ssr: { noExternal: true },
      build: { ssr: path.join(consumer, "entry.mjs"), outDir, minify: false },
    })

    // Without the managed resolver, the project boundary catches the widget
    // resolving React from either its local or ancestor node_modules folder.
    await expect(build(config([main, boundary], "unmanaged"))).rejects.toThrow(
      /Managed runtime package "react" resolved outside Ardo's own installation/u
    )

    const bundle = await build(config([main, boundary, managedRuntime], "managed"))
    if (Array.isArray(bundle) || !("output" in bundle)) {
      throw new Error("Expected a single SSR bundle")
    }
    type BundleEntry =
      { type: "chunk"; imports: string[]; dynamicImports: string[] } | { type: "asset" }
    const bundleEntries = (bundle as { output: BundleEntry[] }).output
    const imports: string[] = bundleEntries.flatMap((entry) =>
      entry.type === "chunk" ? [...entry.imports, ...entry.dynamicImports] : []
    )
    expect(imports.every((id) => isBuiltin(id))).toBe(true)

    const output = await import(pathToFileURL(path.join(consumer, "managed/entry.js")).href)
    expect(output.html).toContain("shared-runtime")
    expect(output.html).toContain("docs-widget")
    expect(output.html).toContain("ancestor-widget")
    expect(output.html).toContain('aria-label="Toggle theme"')
    expect(output.html).toContain("Ardo UI")
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}, 60_000)
