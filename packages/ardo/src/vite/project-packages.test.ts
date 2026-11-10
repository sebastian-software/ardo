import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import type * as nodeFs from "node:fs"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectPackages } from "./project-packages"

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof nodeFs>()
  return { ...actual, realpathSync: vi.fn(actual.realpathSync) }
})

let parent: string
let root: string

function writePackage(relative: string, manifest: object) {
  const directory = path.join(parent, relative)
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, "package.json"), JSON.stringify(manifest))
  writeFileSync(path.join(directory, "index.js"), "export const value = 1")
  return directory
}

beforeEach(() => {
  parent = mkdtempSync(path.join(os.tmpdir(), "ardo-package-boundary-"))
  root = writePackage("docs", { type: "module" })
})

afterEach(() => {
  rmSync(parent, { recursive: true, force: true })
})

describe("documentation package ownership", () => {
  it("rejects a declared package installed only in an ancestor", () => {
    writePackage("node_modules/dependency", { name: "dependency" })
    writePackage("docs", { dependencies: { dependency: "1" } })
    const packages = new ProjectPackages(root)
    expect(() => packages.checkImport("dependency", path.join(root, "entry.js"))).toThrow(
      /not installed.*docs\/node_modules/u
    )
  })

  it("rejects undeclared application imports even when the package is transitive", () => {
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage("docs/node_modules/dependency", {
      name: "dependency",
      dependencies: { nested: "1" },
    })
    writePackage("docs/node_modules/nested", { name: "nested" })
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkImport("nested", path.join(root, "entry.js"))
    }).toThrow(/Undeclared dependency "nested"/u)
    expect(() => {
      packages.checkImport("nested", path.join(root, "node_modules/dependency/index.js"))
    }).not.toThrow()
  })

  it("does not satisfy a dependency's missing peer from the ancestor's root", () => {
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage("node_modules/peer", { name: "peer" })
    const dependency = writePackage("node_modules/.pnpm/dependency/node_modules/dependency", {
      name: "dependency",
      peerDependencies: { peer: "1" },
    })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(dependency, path.join(root, "node_modules/dependency"), "dir")
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkImport("peer", path.join(dependency, "index.js"))
    }).toThrow(/not installed/u)
  })

  it("rejects undeclared workspace source links and source symlinks inside the project", () => {
    const outside = writePackage("components", { name: "components" })
    symlinkSync(outside, path.join(root, "components"), "dir")
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkFile(path.join(root, "components/index.js"))
    }).toThrow(/Import outside the documentation package/u)
  })

  it("allows declared local workspace source and its own declared dependencies", () => {
    const components = writePackage("packages/components", {
      name: "components",
      dependencies: { tokens: "workspace:*", dependency: "1" },
    })
    const tokens = writePackage("packages/tokens", {
      name: "tokens",
      dependencies: { components: "workspace:*" },
    })
    const dependency = writePackage("packages/components/node_modules/dependency", {
      name: "dependency",
    })
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(components, path.join(root, "node_modules/components"), "dir")
    symlinkSync(tokens, path.join(components, "node_modules/tokens"), "dir")
    mkdirSync(path.join(tokens, "node_modules"))
    symlinkSync(components, path.join(tokens, "node_modules/components"), "dir")
    const packages = new ProjectPackages(root)
    expect(packages.workspaceRoots).toHaveLength(2)
    const importer = path.join(components, "index.js")
    expect(() => {
      packages.checkImport("components", path.join(root, "entry.js"))
      packages.checkFile(importer, { importer: path.join(root, "entry.js") })
      packages.checkImport("tokens", importer)
      packages.checkFile(path.join(tokens, "index.js"), { importer })
      packages.checkImport("dependency", importer)
      packages.checkFile(path.join(dependency, "index.js"), { importer })
      packages.checkFile(path.join(tokens, "index.js"))
    }).not.toThrow()
    expect(() => packages.checkImport("tokens", path.join(root, "entry.js"))).toThrow(
      /Undeclared dependency "tokens"/u
    )
    expect(() => {
      packages.checkFile(path.join(tokens, "index.js"), { importer: path.join(root, "entry.js") })
    }).toThrow(/Undeclared application dependency "tokens"/u)
  })

  it("does not inherit ancestor dependencies from a workspace package", () => {
    const components = writePackage("packages/components", {
      name: "components",
      dependencies: { dependency: "1" },
    })
    writePackage("packages/node_modules/dependency", { name: "dependency" })
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(components, path.join(root, "node_modules/components"), "dir")
    const packages = new ProjectPackages(root)
    expect(() => packages.checkImport("dependency", path.join(components, "index.js"))).toThrow(
      /not installed.*components\/node_modules/u
    )
  })

  it("allows generated transitive workspace styles only from style source modules", () => {
    const components = writePackage("packages/components", {
      name: "components",
      dependencies: { tokens: "workspace:*" },
    })
    const tokens = writePackage("packages/tokens", { name: "tokens" })
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    mkdirSync(path.join(components, "node_modules"))
    symlinkSync(components, path.join(root, "node_modules/components"), "dir")
    symlinkSync(tokens, path.join(components, "node_modules/tokens"), "dir")
    const importer = path.join(root, "app.css.ts")
    const stylesheet = path.join(tokens, "theme.css.ts")
    writeFileSync(importer, "export const styles = {};")
    writeFileSync(stylesheet, "export const theme = {};")
    const generated = `${stylesheet}.vanilla.css?source=encoded-css`
    const packages = new ProjectPackages(root)
    expect(() => packages.checkFile(generated, { importer })).not.toThrow()
    expect(() =>
      packages.checkFile(stylesheet, { importer, styleWatchFiles: [stylesheet] })
    ).not.toThrow()
    const helper = path.join(tokens, "index.js")
    expect(() => packages.checkFile(helper, { importer, styleWatchFiles: [helper] })).not.toThrow()
    expect(() =>
      packages.checkFile(helper, {
        importer: path.join(root, "index.js"),
        styleWatchFiles: [helper],
      })
    ).toThrow(/Undeclared application dependency "tokens"/u)
    for (const file of [
      stylesheet,
      path.join(tokens, "index.js"),
      path.join(tokens, "missing.css.ts.vanilla.css"),
    ]) {
      expect(() => packages.checkFile(file, { importer })).toThrow(
        /Undeclared application dependency "tokens"/u
      )
    }
    expect(() => packages.checkFile(generated, { importer: path.join(root, "index.js") })).toThrow(
      /Undeclared application dependency "tokens"/u
    )
    const outside = writePackage("outside", { name: "outside" })
    writeFileSync(path.join(outside, "theme.css.ts"), "export const theme = {};")
    symlinkSync(path.join(outside, "theme.css.ts"), path.join(tokens, "escape.css.ts"))
    expect(() =>
      packages.checkFile(path.join(tokens, "escape.css.ts.vanilla.css"), { importer })
    ).toThrow(/Undeclared application dependency "tokens"/u)
  })

  it("rejects a workspace source symlink escaping its installed package", () => {
    const components = writePackage("packages/components", { name: "components" })
    const outside = writePackage("packages/other", { name: "other" })
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(components, path.join(root, "node_modules/components"), "dir")
    symlinkSync(outside, path.join(components, "other"), "dir")
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkFile(path.join(components, "other/index.js"), {
        importer: path.join(components, "index.js"),
      })
    }).toThrow(/Import outside the documentation package/u)
  })

  it("allows missing optional packages until an import actually needs them", () => {
    writePackage("docs", { optionalDependencies: { optional: "1" } })
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkImport("optional", path.join(root, "entry.js"))
    }).toThrow(/not installed/u)
  })

  it("allows only Ardo-owned runtime packages through the docs boundary", () => {
    const ardo = writePackage("framework", {
      name: "ardo",
      dependencies: { react: "19" },
    })
    const managedReact = writePackage("framework/node_modules/react", { name: "react" })
    writePackage("docs", { dependencies: { react: "20" } })
    const appReact = writePackage("docs/node_modules/react", { name: "react" })
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })
    const importer = path.join(root, "entry.js")

    expect(() => packages.checkImport("react/jsx-runtime", importer)).not.toThrow()
    expect(() => {
      packages.checkFile(path.join(managedReact, "index.js"), { importer, managedName: "react" })
    }).not.toThrow()
    expect(() => {
      packages.checkFile(path.join(managedReact, "index.js"), { importer })
    }).not.toThrow()
    expect(() => {
      packages.checkFile(path.join(appReact, "index.js"), { importer, managedName: "react" })
    }).toThrow(/resolved outside Ardo's own installation/u)
    expect(() => packages.checkImport("unmanaged-package", importer)).toThrow(
      /Undeclared dependency "unmanaged-package"/u
    )
  })

  it("rejects the docs React package even when a dependency or alias points to it", () => {
    const ardo = writePackage("framework", {
      name: "ardo",
      dependencies: { react: "19" },
    })
    writePackage("framework/node_modules/react", { name: "react" })
    writePackage("docs", { dependencies: { react: "20" } })
    const appReact = writePackage("docs/node_modules/react", { name: "react" })
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })

    expect(() => {
      packages.checkFile(path.join(appReact, "index.js"), {
        importer: path.join(root, "app/route.js"),
      })
    }).toThrow(/Managed runtime package "react" resolved outside Ardo's own installation/u)
    expect(() => {
      packages.checkFile(path.join(appReact, "index.js"))
    }).toThrow(/Managed runtime package "react" resolved outside Ardo's own installation/u)
  })

  it("rejects a workspace package's competing managed runtime when imported by path", () => {
    const ardo = writePackage("framework", { name: "ardo", dependencies: { react: "19" } })
    const managedReact = writePackage("framework/node_modules/react", { name: "react" })
    const components = writePackage("packages/components", {
      name: "components",
      peerDependencies: { react: "20" },
    })
    const workspaceReact = writePackage("packages/components/node_modules/react", {
      name: "react",
    })
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(components, path.join(root, "node_modules/components"), "dir")
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })
    const importer = path.join(components, "index.js")
    expect(() => packages.checkImport("react", importer)).not.toThrow()
    expect(() =>
      packages.checkFile(path.join(managedReact, "index.js"), { importer })
    ).not.toThrow()
    expect(() => packages.checkFile(path.join(workspaceReact, "index.js"), { importer })).toThrow(
      /Managed runtime package "react" resolved outside Ardo's own installation/u
    )
  })

  it("rechecks optimizer cache IDs against the source validated at resolution", () => {
    const ardo = writePackage("framework", {
      name: "ardo",
      dependencies: { react: "19" },
    })
    const managedReact = writePackage("framework/node_modules/react", { name: "react" })
    const docsReact = writePackage("docs/node_modules/react", { name: "react" })
    const optimizedReact = path.join(root, "node_modules/.vite/deps/react.js")
    mkdirSync(path.dirname(optimizedReact), { recursive: true })
    writeFileSync(optimizedReact, "export const version = 'optimized'")
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })
    const importer = path.join(root, "entry.js")

    expect(() => {
      packages.checkFile(optimizedReact, {
        importer,
        managedName: "react",
        managedSourcePath: path.join(managedReact, "index.js"),
      })
    }).not.toThrow()
    expect(() => {
      packages.checkFile(optimizedReact)
    }).not.toThrow()
    expect(() => {
      new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true }).checkFile(
        optimizedReact,
        { importer, managedName: "react", managedSourcePath: path.join(docsReact, "index.js") }
      )
    }).toThrow(/resolved outside Ardo's own installation/u)
  })

  it("does not treat an Ardo peer as an owned runtime package", () => {
    const ardo = writePackage("framework", {
      name: "ardo",
      peerDependencies: { react: "19" },
    })
    writePackage("framework/node_modules/react", { name: "react" })
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })

    expect(() => packages.checkImport("react", path.join(root, "entry.js"))).toThrow(
      /Undeclared dependency "react"/u
    )
  })

  it("allows no-importer framework files only for direct Ardo dependencies", () => {
    const ardo = writePackage("framework", {
      name: "ardo",
      // cspell:ignore minisearch
      dependencies: { minisearch: "7", react: "19" },
    })
    writePackage("framework/node_modules/react", { name: "react" })
    const frameworkMiniSearch = writePackage("framework/node_modules/minisearch", {
      name: "minisearch",
    })
    const appMiniSearch = writePackage("docs/node_modules/minisearch", { name: "minisearch" })
    const packages = new ProjectPackages(root, { ardoRoot: ardo, managedRuntime: true })

    expect(() => {
      packages.checkFile(path.join(frameworkMiniSearch, "index.js"))
    }).not.toThrow()
    expect(() => {
      packages.checkFile(path.join(appMiniSearch, "index.js"))
    }).toThrow(/Undeclared application dependency "minisearch"/u)
    expect(() => {
      packages.checkFile(path.join(appMiniSearch, "index.js"), {
        importer: path.join(root, "entry.js"),
      })
    }).toThrow(/Undeclared application dependency "minisearch"/u)
  })
})

describe("filesystem lookups", () => {
  it("resolves each path once for repeated checks", () => {
    writePackage("docs", { dependencies: { dependency: "1" } })
    writePackage("docs/node_modules/dependency", { name: "dependency" })
    const packages = new ProjectPackages(root)
    const file = path.join(root, "node_modules/dependency/index.js")
    const importer = path.join(root, "entry.js")
    packages.checkFile(file, { importer })
    const lookups = vi.mocked(realpathSync).mock.calls.length
    expect(lookups).toBeGreaterThan(0)
    packages.checkFile(file, { importer })
    packages.checkFile(file, { importer })
    expect(vi.mocked(realpathSync).mock.calls).toHaveLength(lookups)
  })
})
