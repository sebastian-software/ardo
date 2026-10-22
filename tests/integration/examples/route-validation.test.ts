import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { createTestProject } from "./project"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

function project(): string {
  const directory = fs.realpathSync(createTestProject())
  directories.push(directory)
  return directory
}

function writeRoute(directory: string, file: string, content: string): void {
  const target = path.join(directory, "app/routes", file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
}

function build(directory: string) {
  const result = spawnSync(
    "pnpm",
    ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"],
    {
      cwd: directory,
      encoding: "utf8",
      timeout: 120_000,
    }
  )
  if (result.error != null) throw result.error
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}

describe("real CLI route validation", () => {
  it.each([
    { existing: "home.tsx", added: "index.mdx", url: "/" },
    {
      existing: "guide/getting-started.mdx",
      added: "guide/getting-started.md",
      url: "/guide/getting-started",
    },
  ])("rejects $added colliding with $existing", ({ existing, added, url }) => {
    const directory = project()
    writeRoute(directory, added, "# Duplicate page\n")
    const result = build(directory)

    expect(result.status).toBe(1)
    expect(result.output).toContain(`Multiple route files resolve to the same URL:`)
    expect(result.output).toContain(url)
    expect(result.output).toContain(path.join(directory, "app/routes", existing))
    expect(result.output).toContain(path.join(directory, "app/routes", added))
    expect(fs.existsSync(path.join(directory, "build/client/index.html"))).toBe(false)
  })

  it("fails instead of publishing a 404 document for a route without a default export", () => {
    const directory = project()
    writeRoute(
      directory,
      "named-only.tsx",
      "export function NamedOnly() { return <h1>Named Only Page</h1> }\n"
    )
    const result = build(directory)

    expect(result.status).toBe(1)
    expect(result.output).toContain(
      '[ardo] Route "app/routes/named-only.tsx" must export a default page component.'
    )
    expect(fs.existsSync(path.join(directory, "build/client/named-only/index.html"))).toBe(false)
  })

  it("builds distinct translations and dynamic routes and retains the intentional 404 artifact", () => {
    const directory = project()
    fs.rmSync(path.join(directory, "app/routes"), { recursive: true })
    for (const locale of ["en", "de"]) {
      writeRoute(
        directory,
        `${locale}/home.tsx`,
        `export default function Home() { return <h1>${locale} Home</h1> }`
      )
      writeRoute(directory, `${locale}/guide/intro.mdx`, `# ${locale} Guide\n`)
      writeRoute(
        directory,
        `${locale}/guide/$slug.tsx`,
        "export default function DynamicPage() { return <h1>Dynamic Page</h1> }"
      )
    }
    fs.writeFileSync(
      path.join(directory, "ardo.config.ts"),
      `
      import { defineArdoConfig } from "ardo/config";
      export default defineArdoConfig({
        title: "Route validation", githubPages: false,
        versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] },
        i18n: { defaultLocale: "en", locales: [{ id: "en" }, { id: "de" }] },
      });
    `
    )
    const result = build(directory)

    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain("Prerendered 4 pages")
    for (const locale of ["en", "de"]) {
      const html = fs.readFileSync(
        path.join(directory, `build/client/v6/${locale}/guide/intro/index.html`),
        "utf8"
      )
      expect(html).toContain(`${locale} Guide`)
      expect(
        fs.existsSync(path.join(directory, `build/client/v6/${locale}/guide/:slug/index.html`))
      ).toBe(false)
    }
    expect(fs.readFileSync(path.join(directory, "build/client/v6/404.html"), "utf8")).toContain(
      "Error 404"
    )
  })
})
