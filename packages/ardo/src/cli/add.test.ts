import fs from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { listRecipes, runAddCommand } from "./add"

function output() {
  const stdout: string[] = []
  const stderr: string[] = []
  return {
    stdout: {
      write(value: string | Uint8Array) {
        stdout.push(String(value))
        return true
      },
    },
    stderr: {
      write(value: string | Uint8Array) {
        stderr.push(String(value))
        return true
      },
    },
    text: () => ({ stdout: stdout.join(""), stderr: stderr.join("") }),
  }
}

const mutatingCalls = [
  "writeFileSync",
  "appendFileSync",
  "mkdirSync",
  "rmSync",
  "unlinkSync",
  "renameSync",
  "copyFileSync",
  "cpSync",
  "symlinkSync",
  "truncateSync",
] as const

describe("ardo add", () => {
  const roots: string[] = []
  let spies: Array<{ mockRestore: () => void }> = []

  beforeEach(() => {
    // Recipes are read through the default `fs` object, so spying on it sees every call.
    spies = mutatingCalls.map((name) => vi.spyOn(fs, name))
  })

  afterEach(async () => {
    for (const spy of spies) spy.mockRestore()
    for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
  })

  it("lists the shipped recipes with one-line descriptions and writes nothing", () => {
    const io = output()
    expect(runAddCommand([], io)).toBe(0)

    const { stdout, stderr } = io.text()
    expect(stderr).toBe("")
    expect(stdout).toContain("Available recipes:")
    for (const recipe of listRecipes()) {
      expect(stdout).toMatch(
        new RegExp(`^  ${recipe.name}\\s+${escape(recipe.description)}$`, "mu")
      )
    }
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  })

  it("prints one recipe's Markdown to stdout without writing files", () => {
    const io = output()
    const recipe = listRecipes().find((candidate) => candidate.name === "locale")
    expect(recipe).toBeDefined()

    expect(runAddCommand(["locale"], io)).toBe(0)

    expect(io.text()).toStrictEqual({ stdout: recipe?.markdown, stderr: "" })
    expect(io.text().stdout.startsWith("---\nname: locale\n")).toBe(true)
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  })

  it("exits with code 2 and lists valid names for an unknown recipe", () => {
    const io = output()
    expect(runAddCommand(["missing"], io)).toBe(2)

    const { stdout, stderr } = io.text()
    expect(stdout).toBe("")
    expect(stderr).toContain('Unknown recipe "missing"')
    expect(stderr).toContain("api-reference, locale, version")
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  })

  it("rejects extra arguments with a usage error", () => {
    const io = output()
    expect(runAddCommand(["locale", "extra"], io)).toBe(2)
    expect(io.text().stdout).toBe("")
    expect(io.text().stderr).toContain("Usage: ardo add")
  })

  it("prints help without reading recipes", () => {
    const io = output()
    expect(runAddCommand(["--help"], io)).toBe(0)
    expect(io.text().stdout).toContain("Usage: ardo add [recipe]")
    expect(io.text().stdout).toContain("writes no files")
  })

  it("fails with a clear message when a recipe has invalid frontmatter", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-recipes-"))
    roots.push(root)
    await writeFile(path.join(root, "broken.md"), "# No frontmatter\n")

    const io = output()
    expect(runAddCommand([], io, root)).toBe(1)
    expect(io.text().stderr).toContain("Recipe broken.md needs name and description frontmatter.")
  })

  it("rejects a recipe whose frontmatter name differs from its file name", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "ardo-recipes-"))
    roots.push(root)
    await writeFile(
      path.join(root, "other.md"),
      "---\nname: different\ndescription: Wrong name.\n---\n\n# Other\n"
    )

    expect(() => listRecipes(root)).toThrow('must be named after its frontmatter name "different"')
  })
})

function escape(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)
}
