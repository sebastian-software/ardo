import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ProjectPackages } from "./project-packages"

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

  it("rejects workspace source links and source symlinks inside the project", () => {
    const outside = writePackage("components", { name: "components" })
    symlinkSync(outside, path.join(root, "components"), "dir")
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkFile(path.join(root, "components/index.js"))
    }).toThrow(/Import outside the documentation package/u)
    writePackage("docs", { dependencies: { components: "workspace:*" } })
    mkdirSync(path.join(root, "node_modules"))
    symlinkSync(outside, path.join(root, "node_modules/components"), "dir")
    expect(() => {
      new ProjectPackages(root).checkFile(
        path.join(root, "node_modules/components/index.js"),
        path.join(root, "entry.js")
      )
    }).toThrow(/Import outside the documentation package/u)
  })

  it("allows missing optional packages until an import actually needs them", () => {
    writePackage("docs", { optionalDependencies: { optional: "1" } })
    const packages = new ProjectPackages(root)
    expect(() => {
      packages.checkImport("optional", path.join(root, "entry.js"))
    }).toThrow(/not installed/u)
  })
})
