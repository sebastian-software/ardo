import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"

import { runCli } from "./run"
import { environmentFindings, satisfiesMinimumVersion } from "./check"

const pluginSource = fileURLToPath(new URL("../vite/plugin.ts", import.meta.url))

let temporaryDirectory: string | undefined

afterEach(() => {
  if (temporaryDirectory !== undefined) {
    rmSync(temporaryDirectory, { recursive: true, force: true })
    temporaryDirectory = undefined
  }
})

/**
 * A project whose config loads the Ardo plugin from source. The preparer replaces the generated
 * wrapper, so the test exercises the same Vite config resolution as `ardo build` without building.
 */
function createProject(
  files: Record<string, string>,
  site: Record<string, unknown> = { title: "Fixture" },
  pluginCall = `ardoPlugin(${JSON.stringify(site)})`
): string {
  const root = mkdtempSync(path.join(tmpdir(), "ardo-diagnostics-"))
  temporaryDirectory = root
  const manifest = { name: "fixture", private: true, type: "module" }
  for (const [file, contents] of Object.entries({
    "package.json": `${JSON.stringify(manifest, null, 2)}\n`,
    ...files,
  })) {
    const target = path.join(root, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }
  writeFileSync(
    path.join(root, "vite.config.mjs"),
    [
      `import { ardoPlugin } from ${JSON.stringify(pluginSource)}`,
      `export default { plugins: [${pluginCall}] }`,
      "",
    ].join("\n")
  )
  return root
}

function prepare(root: string) {
  return async () => path.join(root, "vite.config.mjs")
}

function capture() {
  const out: string[] = []
  const err: string[] = []
  return {
    stderr: sink(err),
    stdout: sink(out),
    text: () => out.join(""),
    errorText: () => err.join(""),
  }
}

/** A config preparer for paths that must not reach the project. */
function unloadable(message: string) {
  return (): never => {
    throw new Error(message)
  }
}

function sink(lines: string[]) {
  return {
    write(value: string | Uint8Array) {
      lines.push(String(value))
      return true
    },
  }
}

const slow = 120_000

const cleanPage = "---\ntitle: Home\ndescription: Start here.\n---\n\n## Install\n"

describe("ardo check", () => {
  it(
    "prints a clean project as a JSON array, with only the report on stdout",
    async () => {
      const root = createProject({ "app/routes/index.md": cleanPage })
      const io = capture()
      const outcome = await runCli(["check", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 0 })
      expect(JSON.parse(io.text())).toStrictEqual([])
    },
    slow
  )

  it(
    "reports invalid frontmatter at the declaring line and keeps the default warn policy exit 0",
    async () => {
      const root = createProject({
        "app/routes/broken.md": "---\ntitle: 42\ndescription: Broken.\n---\n\n# Broken\n",
      })
      const io = capture()
      const outcome = await runCli(["check", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 0 })
      expect(JSON.parse(io.text())).toStrictEqual([
        {
          file: "app/routes/broken.md",
          line: 2,
          rule: "frontmatter",
          severity: "warning",
          message: 'Invalid value for frontmatter field "title".',
        },
      ])
    },
    slow
  )

  it(
    "exits 1 when the frontmatter policy makes invalid fields errors",
    async () => {
      const root = createProject(
        { "app/routes/broken.md": "---\ntitle: 42\ndescription: Broken.\n---\n" },
        { title: "Fixture", validation: { frontmatter: { invalid: "error" } } }
      )
      const io = capture()
      const outcome = await runCli(["check", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 1 })
      expect(JSON.parse(io.text())).toContainEqual(
        expect.objectContaining({ rule: "frontmatter", severity: "error" })
      )
    },
    slow
  )

  it(
    "reports a page whose frontmatter cannot be parsed as an error",
    async () => {
      const root = createProject({
        "app/routes/unreadable.md": "---\ntitle: [unclosed\n---\n\n# Unreadable\n",
      })
      const io = capture()
      const outcome = await runCli(["check", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 1 })
      expect(JSON.parse(io.text())).toStrictEqual([
        expect.objectContaining({
          file: "app/routes/unreadable.md",
          rule: "page",
          severity: "error",
        }),
      ])
    },
    slow
  )

  it(
    "reports a project config that fails validation as a config error without a line",
    async () => {
      const root = createProject({ "app/routes/index.md": cleanPage }, { siteUrl: "not a url" })
      const io = capture()
      const outcome = await runCli(["check", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 1 })
      const [finding] = JSON.parse(io.text()) as Array<Record<string, unknown>>
      expect(finding).toMatchObject({ file: ".", rule: "config", severity: "error" })
      expect(finding).not.toHaveProperty("line")
      expect(String(finding?.message)).toContain("siteUrl must be an absolute URL")
    },
    slow
  )

  it("prints a readable text report that ends with a summary", async () => {
    const root = createProject({
      "app/routes/broken.md": "---\ntitle: 42\ndescription: Broken.\n---\n",
    })
    const io = capture()
    await runCli(["check", root], { prepareProjectConfig: prepare(root), ...io })

    expect(io.text()).toContain(
      'app/routes/broken.md:2  warning  frontmatter  Invalid value for frontmatter field "title".'
    )
    expect(io.text()).toContain("ardo check: 0 errors, 1 warning.")
  })

  it("answers help without loading the project", async () => {
    const io = capture()
    const outcome = await runCli(["check", "--help"], {
      ...io,
      prepareProjectConfig: unloadable("the project must not load for help"),
    })

    expect(outcome).toStrictEqual({ type: "exit", code: 0 })
    expect(io.text()).toContain("Usage: ardo check [root] [options]")
  })

  it("reports usage errors with exit code 2", async () => {
    const io = capture()
    const outcome = await runCli(["check", "--format", "xml"], {
      ...io,
      prepareProjectConfig: unloadable("the project must not load for a usage error"),
    })

    expect(outcome).toStrictEqual({ type: "exit", code: 2 })
    expect(io.errorText()).toContain('Unsupported format "xml"')
  })
})

describe("environment check", () => {
  it.each([
    ["22.22.0", ">=22.22.0", true],
    ["v22.22.1", ">=22.22.0", true],
    ["22.21.9", ">=22.22.0", false],
    ["24.0.0", ">=22.22.0", true],
    ["20.19.0", ">=22.22.0", false],
    ["22.0.0", ">=20", true],
  ])("compares Node.js %s with %s", (version, range, expected) => {
    expect(satisfiesMinimumVersion(version, range)).toBe(expected)
  })

  it("cannot evaluate ranges other than minimum versions", () => {
    expect(satisfiesMinimumVersion("22.22.0", "^22")).toBeUndefined()
    expect(environmentFindings("22.22.0", "^22")).toStrictEqual([
      expect.objectContaining({ file: ".", rule: "environment", severity: "warning" }),
    ])
  })

  it("reports an unsupported Node.js version as an error", () => {
    expect(environmentFindings("20.19.0", ">=22.22.0")).toStrictEqual([
      expect.objectContaining({ file: ".", rule: "environment", severity: "error" }),
    ])
    expect(environmentFindings("22.22.0", ">=22.22.0")).toStrictEqual([])
  })
})

describe("ardo lint", () => {
  const sloppyPage = "---\ntitle: Setup\n---\n\n## Install\n\n```\nnpm i\n```\n"

  it(
    "reports warnings as JSON with project-relative paths and exits 0",
    async () => {
      const root = createProject({ "app/routes/guide/setup.md": sloppyPage })
      const io = capture()
      const outcome = await runCli(["lint", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 0 })
      expect(JSON.parse(io.text())).toStrictEqual([
        {
          file: "app/routes/guide/setup.md",
          line: 1,
          rule: "missing-description",
          severity: "warning",
          message: "Add a description to the frontmatter.",
        },
        {
          file: "app/routes/guide/setup.md",
          line: 7,
          column: 1,
          rule: "code-language",
          severity: "warning",
          message: "Code block has no language. Name it after the opening fence, such as ```ts.",
        },
      ])
    },
    slow
  )

  it(
    "exits 1 only for rules that validation.lint raises to error, and drops ignored rules",
    async () => {
      const root = createProject(
        { "app/routes/guide/setup.md": sloppyPage },
        {
          title: "Fixture",
          validation: { lint: { "missing-description": "error", "code-language": "ignore" } },
        }
      )
      const io = capture()
      const outcome = await runCli(["lint", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 1 })
      expect(JSON.parse(io.text())).toStrictEqual([
        expect.objectContaining({ rule: "missing-description", severity: "error" }),
      ])
    },
    slow
  )

  it(
    "lints Markdown and MDX pages, skips TSX routes and pages Ardo generated",
    async () => {
      const root = createProject({
        "app/routes/guide/setup.mdx": sloppyPage,
        "app/routes/tools/page.tsx": "export default function Page() { return null }\n",
        "app/routes/generated/.ardo-generated": "Generated by Ardo.\n",
        "app/routes/generated/page.md": "# Generated\n",
      })
      const io = capture()
      await runCli(["lint", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      const files = new Set(
        (JSON.parse(io.text()) as Array<{ file: string }>).map((finding) => finding.file)
      )
      expect([...files]).toStrictEqual(["app/routes/guide/setup.mdx"])
    },
    slow
  )

  it(
    "honors per-page opt-outs",
    async () => {
      const root = createProject({
        "app/routes/guide/quiet.md": "---\nlint: false\n---\n\n# One\n\n# Two\n",
      })
      const io = capture()
      const outcome = await runCli(["lint", "--format", "json"], {
        cwd: root,
        prepareProjectConfig: prepare(root),
        ...io,
      })

      expect(outcome).toStrictEqual({ type: "exit", code: 0 })
      expect(JSON.parse(io.text())).toStrictEqual([])
    },
    slow
  )

  it(
    "prints a text summary of warnings",
    async () => {
      const root = createProject({ "app/routes/guide/setup.md": sloppyPage })
      const io = capture()
      await runCli(["lint", root], { prepareProjectConfig: prepare(root), ...io })

      expect(io.text()).toContain("app/routes/guide/setup.md:1  warning  missing-description")
      expect(io.text()).toContain("ardo lint: 0 errors, 2 warnings.")
    },
    slow
  )

  it(
    "reports a project that cannot load on stderr and exits 1",
    async () => {
      const root = createProject({}, { siteUrl: "not a url" })
      const io = capture()
      const outcome = await runCli(["lint"], { prepareProjectConfig: prepare(root), ...io })

      expect(outcome).toStrictEqual({ type: "exit", code: 1 })
      expect(io.errorText()).toContain("Ardo lint failed:")
      expect(io.text()).toBe("")
    },
    slow
  )

  it("answers help and rejects unsupported formats", async () => {
    const io = capture()
    expect(await runCli(["lint", "--help"], { ...io })).toStrictEqual({ type: "exit", code: 0 })
    expect(io.text()).toContain("Usage: ardo lint [root] [options]")
    expect(await runCli(["lint", "--format", "yaml"], { ...io })).toStrictEqual({
      type: "exit",
      code: 2,
    })
  })
})
