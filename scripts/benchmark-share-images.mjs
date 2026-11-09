import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createJiti } from "jiti"

// Run after pnpm install && pnpm build, with no competing build/test processes:
// node scripts/benchmark-share-images.mjs --font /path/to/font.ttf --family "Font Family"
// Repeat --font for fallback fonts. The caller owns font licenses and script coverage.
const root = fileURLToPath(new URL("../", import.meta.url))
const args = process.argv.slice(2)
const fonts = args.flatMap((arg, index) =>
  arg === "--font" ? [path.resolve(args[index + 1])] : []
)
const family = args[args.indexOf("--family") + 1]
const artifactDirectory = args.includes("--artifacts")
  ? path.resolve(args[args.indexOf("--artifacts") + 1])
  : undefined
assert(
  fonts.length > 0 && args.includes("--family") && family,
  "Provide --font <local TTF/OTF/TTC> and --family <family name>"
)
const jiti = createJiti(import.meta.url)
const { createTestProject } = await jiti.import("../tests/integration/examples/project.ts")
const directory = createTestProject()
const hash = (value) => createHash("sha256").update(value).digest("hex")
const locales = ["en", "de", "fr", "es", "ja"]
const titles = [
  "Getting started",
  "Einführung & Überblick",
  "Référence française",
  "Guía de instalación",
  "日本語指南",
]
const routeCount = 100
const rounds = 3
const source = await fs.readFile(
  path.join(root, "examples/basic/app/routes/guide/getting-started.mdx"),
  "utf8"
)
const results = { disabled: [], enabled: [] }

async function configure(enabled) {
  const config = {
    title: "Share image benchmark",
    siteUrl: "https://example.test",
    buildTime: "2026-11-10T00:00:00Z",
    buildHash: "share-images-benchmark",
    i18n: { defaultLocale: "en", locales: locales.map((id) => ({ id })) },
    ...(enabled ? { shareImages: { fonts, fontFamily: family } } : {}),
  }
  await fs.writeFile(
    path.join(directory, "ardo.config.ts"),
    `import { defineArdoConfig } from "ardo/config"; export default defineArdoConfig(${JSON.stringify(config)});\n`
  )
}

async function build(enabled) {
  await configure(enabled)
  const start = performance.now()
  execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
    cwd: directory,
    stdio: "pipe",
    timeout: 300_000,
  })
  const elapsedMs = performance.now() - start
  const client = path.join(directory, "build/client")
  const files = await fs.readdir(client, { recursive: true })
  const pngs = files.filter((file) => /^assets\/share\/[a-f0-9]+\.png$/u.test(file))
  assert.equal(pngs.length, enabled ? routeCount : 0)
  const html = await fs.readFile(path.join(client, "ja/guide/page-1/index.html"), "utf8")
  assert.equal(html.includes('property="og:image:width" content="1200"'), enabled)
  const imageBytes = (
    await Promise.all(pngs.map(async (file) => (await fs.stat(path.join(client, file))).size))
  ).reduce((sum, size) => sum + size, 0)
  if (enabled && artifactDirectory != null) {
    await fs.mkdir(artifactDirectory, { recursive: true })
    for (const locale of ["en", "de", "ja"]) {
      const page = await fs.readFile(path.join(client, `${locale}/guide/page-1/index.html`), "utf8")
      const url = /property="og:image" content="([^"]+)"/u.exec(page)?.[1]
      assert(url, "Missing generated share-image URL")
      await fs.copyFile(
        path.join(client, new URL(url).pathname),
        path.join(artifactDirectory, `${locale}.png`)
      )
    }
  }
  return { elapsedMs, generatedImages: pngs.length, imageBytes }
}

try {
  const routes = path.join(directory, "app/routes")
  await fs.rm(routes, { recursive: true, force: true })
  await fs.mkdir(routes)
  await fs.copyFile(path.join(root, "logo.svg"), path.join(directory, "app/logo.svg"))
  await fs.writeFile(
    path.join(directory, "app/root.tsx"),
    'import { ArdoRoot } from "ardo/ui"; import logo from "./logo.svg"; export default function Root() { return <ArdoRoot logo={logo} theme={{ color: "green" }} /> }\n'
  )
  for (const [index, locale] of locales.entries()) {
    const folder = path.join(routes, locale, "guide")
    await fs.mkdir(folder, { recursive: true })
    for (let page = 1; page <= routeCount / locales.length; page++) {
      const title = `${titles[index]} ${page}`
      await fs.writeFile(
        path.join(folder, `page-${page}.md`),
        source.replace(/^title:.*$/mu, `title: ${title}`)
      )
    }
    await fs.writeFile(
      path.join(routes, locale, "home.tsx"),
      "export default function Home() { return <p>Benchmark home</p> }\n"
    )
  }
  // Warm both modes once; each timed sample still starts a fresh CLI process.
  await build(false)
  await build(true)
  for (let round = 0; round < rounds; round++) {
    for (const enabled of round % 2 === 0 ? [false, true] : [true, false]) {
      const sample = await build(enabled)
      results[enabled ? "enabled" : "disabled"].push(sample)
      process.stderr.write(
        `${enabled ? "enabled" : "disabled"} ${sample.elapsedMs.toFixed(1)} ms\n`
      )
    }
  }
  const median = (samples) =>
    samples.map((sample) => sample.elapsedMs).sort((a, b) => a - b)[Math.floor(samples.length / 2)]
  const fontInfo = await Promise.all(
    fonts.map(async (file) => {
      const bytes = await fs.readFile(file)
      return { file: path.basename(file), bytes: bytes.length, sha256: hash(bytes) }
    })
  )
  const sourceFiles = execFileSync(
    "git",
    [
      "-C",
      root,
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "packages/ardo/src",
    ],
    { encoding: "utf8" }
  )
    .trim()
    .split("\n")
    .sort()
  const sourceHashes = await Promise.all(
    sourceFiles.map(async (file) => [file, hash(await fs.readFile(path.join(root, file)))])
  )
  console.log(
    JSON.stringify(
      {
        date: "2026-11-10",
        node: process.version,
        platform: `${os.platform()} ${os.release()} ${os.arch()}`,
        cpu: os.cpus()[0].model,
        logicalCpus: os.cpus().length,
        memoryBytes: os.totalmem(),
        routes: routeCount,
        locales,
        rounds,
        warmupsPerMode: 1,
        fontFamily: family,
        fonts: fontInfo,
        markdownSourceSha256: hash(source),
        lockSha256: hash(await fs.readFile(path.join(root, "pnpm-lock.yaml"))),
        scriptSha256: hash(await fs.readFile(fileURLToPath(import.meta.url))),
        sourceTreeSha256: hash(JSON.stringify(sourceHashes)),
        trackedSourcePatchSha256: hash(
          execFileSync("git", ["-C", root, "diff", "--binary", "--", "packages/ardo/src"])
        ),
        samples: results,
        medianMs: {
          disabled: median(results.disabled),
          enabled: median(results.enabled),
          added: median(results.enabled) - median(results.disabled),
        },
      },
      null,
      2
    )
  )
} finally {
  await fs.rm(directory, { recursive: true, force: true })
}
