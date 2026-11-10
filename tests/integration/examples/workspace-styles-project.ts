import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { repositoryRoot } from "./project.ts"

/** A direct source package re-exports a transitive package's Vanilla Extract theme. */
export function createWorkspaceStylesProject() {
  const parent = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ardo-workspace-styles-")))
  const framework = path.join(repositoryRoot, "packages/ardo")
  const css = realpathSync(path.join(framework, "node_modules/@vanilla-extract/css"))
  const writePackage = (relative: string, manifest: object) => {
    const directory = path.join(parent, relative)
    mkdirSync(path.join(directory, "node_modules"), { recursive: true })
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({ type: "module", ...manifest })
    )
    mkdirSync(path.join(directory, "node_modules/@vanilla-extract"))
    symlinkSync(css, path.join(directory, "node_modules/@vanilla-extract/css"), "dir")
    return directory
  }
  const root = writePackage("docs", {
    name: "docs",
    dependencies: {
      ardo: "workspace:*",
      components: "workspace:*",
      "@vanilla-extract/css": "1",
    },
  })
  const components = writePackage("packages/components", {
    name: "components",
    exports: "./index.css.ts",
    dependencies: { tokens: "workspace:*", "@vanilla-extract/css": "1" },
  })
  const tokens = writePackage("packages/tokens", {
    name: "tokens",
    exports: { ".": "./index.ts", "./theme.css": "./theme.css.ts" },
    dependencies: { "@vanilla-extract/css": "1" },
  })
  symlinkSync(framework, path.join(root, "node_modules/ardo"), "dir")
  symlinkSync(components, path.join(root, "node_modules/components"), "dir")
  symlinkSync(tokens, path.join(components, "node_modules/tokens"), "dir")
  writeFileSync(
    path.join(tokens, "theme.css.ts"),
    'import { createGlobalTheme } from "@vanilla-extract/css"; import { palette } from "./index"; export const vars = createGlobalTheme(":root", palette);'
  )
  writeFileSync(
    path.join(tokens, "index.ts"),
    'export { palette } from "./palette"; export const value = 42;'
  )
  writeFileSync(
    path.join(tokens, "palette.ts"),
    'import { rgb } from "./helpers"; export const palette = { color: rgb(23, 45, 67) };'
  )
  writeFileSync(
    path.join(tokens, "helpers.ts"),
    "export const rgb = (red: number, green: number, blue: number) => `rgb(${red}, ${green}, ${blue})`;"
  )
  writeFileSync(path.join(components, "index.css.ts"), 'export { vars } from "tokens/theme.css";')
  writeFileSync(
    path.join(root, "app.css.ts"),
    'import { globalStyle } from "@vanilla-extract/css"; import { vars } from "components"; globalStyle("#counter", { color: vars.color });'
  )
  writeFileSync(
    path.join(root, "index.html"),
    '<!doctype html><html><head><title>Workspace styles</title></head><body><div id="root"><button id="counter" data-hydrated="false">Count: 0</button></div><script type="module" src="/entry.js"></script></body></html>'
  )
  writeFileSync(
    path.join(root, "entry.js"),
    `import { createElement, useEffect, useState } from "ardo/react";
import { hydrateRoot } from "ardo/react-dom/client";
import "./app.css.ts";
function Counter() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return createElement("button", { id: "counter", "data-hydrated": String(hydrated), onClick: () => setCount(count + 1) }, "Count: " + count);
}
hydrateRoot(document.getElementById("root"), createElement(Counter));`
  )
  return { parent, root, components, tokens }
}
