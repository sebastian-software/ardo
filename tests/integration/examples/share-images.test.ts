import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"
import { createTestProject, repositoryRoot } from "./project"

const directory = createTestProject()
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }))
const font = path.join(repositoryRoot, "tests/fixtures/share-images/ArdoTestSans.ttf")
const client = path.join(directory, "build/client")
const locales = ["en", "de", "fr", "es", "ja"]
const titles = [
  "Getting started",
  "Einführung & Überblick",
  "Référence française",
  "Guía de instalación",
  "日本語指南",
]

function build(enabled: boolean) {
  fs.writeFileSync(
    path.join(directory, "ardo.config.ts"),
    `import { defineArdoConfig } from "ardo/config"; export default defineArdoConfig({ title: "Share fixture", siteUrl: "https://example.test", base: "/project/", versioning: { current: "v6", versions: [{ id: "v6", path: "/v6/" }] }, i18n: { defaultLocale: "en", locales: ${JSON.stringify(locales.map((id) => ({ id })))} }, metadata: { image: "https://example.test/default.png" }, ${enabled ? `shareImages: { fonts: [${JSON.stringify(font)}], fontFamily: "Ardo Test Sans" },` : ""} });`
  )
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 120_000,
  })
}

describe("real share-card CLI build", () => {
  it("collects root appearance, emits localized cards and metadata, and leaves the disabled build unchanged", () => {
    const routes = path.join(directory, "app/routes")
    fs.rmSync(routes, { recursive: true })
    fs.mkdirSync(routes)
    fs.copyFileSync(path.join(repositoryRoot, "logo.svg"), path.join(directory, "app/logo.svg"))
    fs.writeFileSync(
      path.join(directory, "app/root.tsx"),
      `import { ArdoRoot } from "ardo/ui"; import { useArdoPath } from "ardo/runtime"; import logo from "./logo.svg"; export default function Root() { const pathname = useArdoPath(); return <ArdoRoot logo={logo} theme={{ color: pathname.startsWith("/de/") ? "blue" : "green" }} />; }`
    )
    for (const [index, locale] of locales.entries()) {
      const folder = path.join(routes, locale, "guide")
      fs.mkdirSync(folder, { recursive: true })
      fs.writeFileSync(
        path.join(routes, locale, "home.md"),
        `---\ntitle: ${titles[index]}\n---\n\n${titles[index]}\n`
      )
      fs.writeFileSync(
        path.join(folder, "manual.md"),
        `---\ntitle: Manual\nogImage: https://example.test/manual.png\n---\n\nManual\n`
      )
      fs.writeFileSync(
        path.join(folder, "twitter.md"),
        `---\ntitle: Twitter\ntwitterImage: https://example.test/twitter.png\n---\n\nTwitter\n`
      )
      fs.writeFileSync(path.join(folder, "plain.md"), "# Plain *heading*\n\nNo YAML is needed.\n")
      fs.writeFileSync(
        path.join(folder, "route-name.mdx"),
        "A route with no frontmatter or heading.\n"
      )
      fs.writeFileSync(
        path.join(folder, "own.tsx"),
        "export default function Own() { return <p>Own TSX page</p> }"
      )
    }
    build(false)
    expect(fs.existsSync(path.join(client, "v6/assets/share"))).toBe(false)
    const before = fs.readFileSync(path.join(client, "v6/en/index.html"), "utf8")
    expect(before).toContain('property="og:image" content="https://example.test/default.png"')
    build(true)
    const urls = []
    for (const [index, locale] of locales.entries()) {
      const html = fs.readFileSync(path.join(client, `v6/${locale}/index.html`), "utf8")
      const image = /property="og:image" content="([^"]+)"/u.exec(html)?.[1]
      expect(image).toMatch(
        /^https:\/\/example\.test\/project\/v6\/assets\/share\/[a-f0-9]+\.png$/u
      )
      const png = fs.readFileSync(
        path.join(client, new URL(image!).pathname.slice("/project/".length))
      )
      expect(png.readUInt32BE(16)).toBe(1200)
      expect(png.readUInt32BE(20)).toBe(630)
      expect(html).toContain('property="og:image:width" content="1200"')
      expect(html).toContain('property="og:image:height" content="630"')
      expect(html).toContain('property="og:image:alt"')
      expect(html).toContain(titles[index].split(" & ")[0])
      expect(
        fs.readFileSync(path.join(client, `v6/${locale}/guide/manual/index.html`), "utf8")
      ).toContain('property="og:image" content="https://example.test/manual.png"')
      expect(
        fs.readFileSync(path.join(client, `v6/${locale}/guide/twitter/index.html`), "utf8")
      ).toContain('name="twitter:image" content="https://example.test/twitter.png"')
      expect(
        fs.readFileSync(path.join(client, `v6/${locale}/guide/own/index.html`), "utf8")
      ).not.toContain('property="og:image"')
      expect(
        fs.readFileSync(path.join(client, `v6/${locale}/guide/plain/index.html`), "utf8")
      ).toContain('property="og:image:alt" content="Plain heading"')
      expect(
        fs.readFileSync(path.join(client, `v6/${locale}/guide/route-name/index.html`), "utf8")
      ).toContain('property="og:image:alt" content="Route Name"')
      urls.push(image)
    }
    expect(new Set(urls).size).toBe(5)
    expect(fs.existsSync(path.join(client, ".vite"))).toBe(false)
    const scripts = fs
      .readdirSync(path.join(client, "v6/assets"))
      .filter((file) => file.endsWith(".js"))
      .map((file) => fs.readFileSync(path.join(client, "v6/assets", file), "utf8"))
      .join("\n")
    expect(scripts).not.toContain(font)
    expect(scripts).not.toContain("Ardo Test Sans")
    expect(scripts).not.toContain("createShareImageRenderer")
  }, 300_000)
})
