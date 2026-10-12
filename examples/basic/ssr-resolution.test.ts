import { cpSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
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
    writeFileSync(path.join(consumer, "package.json"), JSON.stringify({ type: "module" }))
    writeFileSync(
      path.join(consumer, "entry.mjs"),
      'import { createElement } from "react";\n' +
        'import { renderToStaticMarkup } from "react-dom/server";\n' +
        'import { Monitor } from "lucide-react";\n' +
        "export const html = renderToStaticMarkup(createElement(Monitor));\n"
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

    await build({
      ...config,
      configFile: false,
      root: consumer,
      logLevel: "silent",
      build: { ssr: path.join(consumer, "entry.mjs"), outDir: "build", minify: false },
    })
    const output = await import(pathToFileURL(path.join(consumer, "build/entry.js")).href)
    expect(output.html).toContain("<svg")
    expect(output.html).toContain("lucide-monitor")
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}, 30_000)
