import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import {
  findArdoPackageRoot,
  findManagedRuntimePackageRoot,
  getManagedRuntimePackageName,
  getManagedRuntimePackageNames,
} from "./managed-runtime"

describe("managed runtime packages", () => {
  it.each([
    ["react", "react"],
    ["react/jsx-runtime", "react"],
    ["react/jsx-runtime?direct", "react"],
    ["react-dom/client", "react-dom"],
    ["react-router/dom", "react-router"],
    ["@react-router/dev/routes", "@react-router/dev"],
    ["lucide-react", "lucide-react"],
    ["vite", "vite"],
  ])("recognizes %s as part of %s", (id, name) => {
    expect(getManagedRuntimePackageName(id)).toBe(name)
  })

  it.each([
    "../react",
    "/absolute/react.js",
    "@react-router/devtools",
    "react-dom-extra",
    "react-router-dom",
    "unmanaged-package",
  ])("does not manage %s", (id) => {
    expect(getManagedRuntimePackageName(id)).toBeUndefined()
  })

  it("keeps the Ardo-owned package list explicit", () => {
    expect(getManagedRuntimePackageNames()).toStrictEqual([
      "react",
      "react-dom",
      "react-router",
      "@react-router/dev",
      "lucide-react",
      "vite",
    ])
  })

  it("finds the Ardo package containing this resolver", () => {
    expect(findArdoPackageRoot()).toBe(path.resolve(import.meta.dirname, "../.."))
  })

  it("locates direct dependencies from workspace and pnpm package layouts", () => {
    const parent = mkdtempSync(path.join(os.tmpdir(), "ardo-managed-runtime-"))
    try {
      const workspaceRoot = writePackage(parent, "packages/ardo", {
        name: "ardo",
        dependencies: { react: "19" },
      })
      const workspaceReact = writePackage(parent, "packages/ardo/node_modules/react", {
        name: "react",
      })
      expect(findManagedRuntimePackageRoot(workspaceRoot, "react")).toBe(
        realpathSync(workspaceReact)
      )

      const pnpmRoot = writePackage(parent, "node_modules/.pnpm/ardo/node_modules/ardo", {
        name: "ardo",
        dependencies: { react: "19" },
      })
      const pnpmReact = writePackage(parent, "node_modules/.pnpm/ardo/node_modules/react", {
        name: "react",
      })
      expect(findManagedRuntimePackageRoot(pnpmRoot, "react")).toBe(realpathSync(pnpmReact))

      const peerOnlyRoot = writePackage(parent, "peer-only/ardo", {
        name: "ardo",
        peerDependencies: { react: "19" },
      })
      writePackage(parent, "peer-only/node_modules/react", { name: "react" })
      expect(findManagedRuntimePackageRoot(peerOnlyRoot, "react")).toBeUndefined()
    } finally {
      rmSync(parent, { force: true, recursive: true })
    }
  })
})

function writePackage(parent: string, relativePath: string, manifest: object): string {
  const root = path.join(parent, relativePath)
  mkdirSync(root, { recursive: true })
  writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest))
  writeFileSync(path.join(root, "index.js"), "export const value = 1")
  return root
}
