import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { getPackageManagerCommand } from "./package-manager-commands"
import { ArdoPackageManagers } from "./PackageManagers"

describe("getPackageManagerCommand", () => {
  const addCases = [
    ["npm", false, "npm install ardo"],
    ["npm", true, "npm install -D ardo"],
    ["pnpm", false, "pnpm add ardo"],
    ["pnpm", true, "pnpm add -D ardo"],
    ["yarn", false, "yarn add ardo"],
    ["yarn", true, "yarn add -D ardo"],
    ["bun", false, "bun add ardo"],
    ["bun", true, "bun add -d ardo"],
  ] as const

  it.each(addCases)("maps %s with dev=%s to an add command", (manager, dev, expected) => {
    expect(getPackageManagerCommand(manager, { pkg: "ardo", dev })).toBe(expected)
  })

  const execCases = [
    ["npm", "npx ardo"],
    ["pnpm", "pnpm dlx ardo"],
    ["yarn", "yarn dlx ardo"],
    ["bun", "bunx ardo"],
  ] as const

  it.each(execCases)("maps %s to an exec command", (manager, expected) => {
    expect(getPackageManagerCommand(manager, { pkg: "ardo", type: "exec" })).toBe(expected)
  })

  it.each(execCases)("ignores dev for %s exec commands", (manager, expected) => {
    expect(getPackageManagerCommand(manager, { pkg: "ardo", type: "exec", dev: true })).toBe(
      expected
    )
  })

  it("installs several space-separated packages and collapses extra whitespace", () => {
    expect(getPackageManagerCommand("pnpm", { pkg: "  react   react-dom ", dev: true })).toBe(
      "pnpm add -D react react-dom"
    )
  })

  it("appends args after the packages", () => {
    expect(
      getPackageManagerCommand("npm", { pkg: "vitest", dev: true, args: "--save-exact" })
    ).toBe("npm install -D vitest --save-exact")
    expect(getPackageManagerCommand("bun", { pkg: "create-ardo", type: "exec", args: "" })).toBe(
      "bunx create-ardo"
    )
  })

  it("returns an empty string when no package is named", () => {
    expect(getPackageManagerCommand("npm", { pkg: "   " })).toBe("")
  })
})

describe("ArdoPackageManagers", () => {
  it("renders one tab per package manager with the command as plain text", () => {
    const view = renderToStaticMarkup(<ArdoPackageManagers pkg="ardo" />)

    for (const label of ["npm", "pnpm", "yarn", "bun"]) {
      expect(view).toContain(`>${label}</button>`)
    }
    expect(view).toContain("npm install ardo</span>")
    expect(view).toContain("pnpm add ardo</span>")
    expect(view).toContain("yarn add ardo</span>")
    expect(view).toContain("bun add ardo</span>")
    expect(view).toContain('data-lang="bash"')
  })

  it("passes the dev flag through to every add command", () => {
    const view = renderToStaticMarkup(<ArdoPackageManagers pkg="typescript" dev />)

    expect(view).toContain("npm install -D typescript</span>")
    expect(view).toContain("pnpm add -D typescript</span>")
    expect(view).toContain("yarn add -D typescript</span>")
    expect(view).toContain("bun add -d typescript</span>")
  })

  it("renders exec commands with each package runner", () => {
    const view = renderToStaticMarkup(<ArdoPackageManagers pkg="create-ardo" type="exec" />)

    expect(view).toContain("npx create-ardo</span>")
    expect(view).toContain("pnpm dlx create-ardo</span>")
    expect(view).toContain("yarn dlx create-ardo</span>")
    expect(view).toContain("bunx create-ardo</span>")
  })

  it("renders nothing when pkg is empty", () => {
    expect(renderToStaticMarkup(<ArdoPackageManagers pkg="" />)).toBe("")
  })
})
