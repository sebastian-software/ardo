import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const script = fileURLToPath(import.meta.url)
const require = createRequire(path.join(root, "packages/ardo/package.json"))
const hash = (value) => createHash("sha256").update(value).digest("hex")
const relative = (file) => path.relative(root, file)
const rounds = 7
const windowMs = 500
const compileOptions = {
  headingAttributes: true,
  format: "mdx",
  frontMatter: true,
  headingIds: true,
  footnotes: true,
  autolinkLiterals: true,
  calloutComponents: {
    caution: "Danger",
    important: "Info",
    note: "Note",
    tip: "Tip",
    warning: "Warning",
  },
}
const apiConfig = {
  entryPoints: Object.fromEntries(
    ["ui", "runtime", "config"].map((name) => [
      `ardo/${name}`,
      path.join(root, `packages/ardo/src/${name}/index.ts`),
    ])
  ),
  tsconfig: path.join(root, "packages/ardo/tsconfig.api.json"),
}

if (process.argv[2] === "--api-worker") {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-release-benchmark-"))
  try {
    const start = performance.now()
    const { generateNativeDocs } = await import("../packages/ardo/dist/api/index.js")
    const result = await generateNativeDocs(apiConfig, output)
    const elapsedMs = performance.now() - start
    assert(result.items.length > 0)
    const pages = await Promise.all(
      result.pages.map(async (page) => {
        assert(page.content.length > 0)
        const written = await fs.readFile(path.join(output, "api-reference", page.path), "utf8")
        assert(written.endsWith(page.content), `Written content differs for ${page.path}`)
        assert(written.startsWith("---\n"), `Missing frontmatter for ${page.path}`)
        return { path: page.path, sha256: hash(written) }
      })
    )
    console.log(
      JSON.stringify({
        elapsedMs,
        exports: result.items.length,
        pages: pages.length,
        outputSha256: hash(JSON.stringify(pages)),
        diagnostics: result.diagnostics.map(({ file, message }) => ({
          file: relative(file),
          message,
        })),
        unexpandedProperties: result.items
          .filter((item) => !item.propertiesComplete)
          .map((item) => item.name),
      })
    )
  } finally {
    await fs.rm(output, { recursive: true, force: true })
  }
} else {
  assert(
    process.argv[2],
    "Usage: node scripts/benchmark-release.mjs OUTPUT.json (build Ardo first)"
  )
  const { JsxCompiler } = await import(require.resolve("ferromark"))
  // Prohibit network access: populate verified theme/language caches before measuring.
  const compiler = new JsxCompiler({
    theme: { light: "github-light", dark: "github-dark" },
    assets: { remote: false },
  })
  const guideDir = path.join(root, "docs/app/content/guide")
  const guides = await Promise.all(
    (await fs.readdir(guideDir, { recursive: true }))
      .filter((name) => name.endsWith(".mdx"))
      .sort()
      .map(async (name) => ({
        path: relative(path.join(guideDir, name)),
        source: await fs.readFile(path.join(guideDir, name), "utf8"),
      }))
  )
  const outputs = guides.map(({ source }) => compiler.compile(source, compileOptions))
  assert(outputs.every((output) => output.body.length > 0 && output.headings.length > 0))
  const blocks = outputs.flatMap((output, guide) =>
    output.codeBlocks.map((block, index) => ({ ...block, guide: guides[guide].path, index }))
  )
  assert(blocks.length > 0)
  const renderGuides = () =>
    guides.map(({ source }) => compiler.compile(source, compileOptions).body)
  const renderBlocks = () =>
    blocks.map(
      (block) =>
        compiler.renderCodeBlock({ code: block.code, language: block.language, meta: block.meta })
          .jsx
    )
  const { parseSync } = await import(require.resolve("oxc-parser"))
  for (const jsx of [...renderGuides(), ...renderBlocks()]) {
    assert.deepEqual(parseSync("benchmark.tsx", `const Output = () => (${jsx});`).errors, [])
  }
  const scenarios = [
    { name: "guides-to-jsx", run: renderGuides },
    { name: "fences-to-jsx", run: renderBlocks },
  ]
  const expected = Object.fromEntries(
    scenarios.map(({ name, run }) => [name, hash(JSON.stringify(run()))])
  )
  // One full warmup window per scenario, then alternate order across rounds.
  function sample(run) {
    const start = performance.now()
    let iterations = 0
    let elapsedMs = 0
    do {
      const result = run()
      assert.equal(result.length, run === renderGuides ? guides.length : blocks.length)
      iterations++
      elapsedMs = performance.now() - start
    } while (elapsedMs < windowMs)
    return { iterations, elapsedMs, msPerCorpus: elapsedMs / iterations }
  }
  for (const scenario of scenarios) sample(scenario.run)
  const samples = Object.fromEntries(scenarios.map(({ name }) => [name, []]))
  for (let round = 0; round < rounds; round++) {
    for (const scenario of round % 2 ? [...scenarios].reverse() : scenarios) {
      samples[scenario.name].push(sample(scenario.run))
      assert.equal(hash(JSON.stringify(scenario.run())), expected[scenario.name])
    }
  }
  // Independent native compiler sessions, fresh Node process per invocation.
  const apiSamples = []
  let apiExpected
  for (let run = 0; run <= rounds; run++) {
    const result = JSON.parse(
      execFileSync(process.execPath, [script, "--api-worker"], { cwd: root, encoding: "utf8" })
    )
    const stable = { ...result, elapsedMs: undefined }
    apiExpected ??= stable
    assert.deepEqual(stable, apiExpected)
    if (run > 0) apiSamples.push(result)
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const files = execFileSync(
    "git",
    [
      "ls-files",
      "packages/ardo/src",
      "packages/ardo/tsconfig.json",
      "packages/ardo/tsconfig.api.json",
      "pnpm-lock.yaml",
    ],
    { cwd: root, encoding: "utf8" }
  )
    .trim()
    .split("\n")
  const apiFiles = await Promise.all(
    files.map(async (file) => ({
      path: file,
      sha256: hash(await fs.readFile(path.join(root, file))),
    }))
  )
  const report = {
    date: new Date().toISOString(),
    source: {
      commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
      status: execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim(),
      harnessSha256: hash(await fs.readFile(script)),
    },
    machine: {
      platform: os.platform(),
      osVersion:
        os.platform() === "darwin"
          ? execFileSync("sw_vers", { encoding: "utf8" }).trim()
          : os.version(),
      release: os.release(),
      architecture: os.arch(),
      cpu: os.cpus()[0].model,
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      node: process.version,
    },
    versions: Object.fromEntries(
      ["ardo", "ferromark", "typescript"].map((name) => [
        name,
        require(`${name}/package.json`).version,
      ])
    ),
    method: {
      rounds,
      warmupWindows: 1,
      windowMs,
      apiWarmupProcesses: 1,
      themes: { light: "github-light", dark: "github-dark" },
      engineState:
        "Warm shared JsxCompiler; verified assets cached; remote downloads disabled; sequential execution",
      apiState:
        "Fresh Node process and native compiler session; module import through Markdown writes and session disposal; setup and output verification excluded",
      compileOptions,
    },
    corpus: {
      guides: guides.map(({ path, source }) => ({
        path,
        bytes: Buffer.byteLength(source),
        sha256: hash(source),
      })),
      blocks: blocks.map(({ code, language, meta, guide, index }) => ({
        guide,
        index,
        language,
        meta,
        bytes: Buffer.byteLength(code),
        sha256: hash(code),
      })),
      apiConfig: {
        entryPoints: Object.fromEntries(
          Object.entries(apiConfig.entryPoints).map(([name, file]) => [name, relative(file)])
        ),
        tsconfig: relative(apiConfig.tsconfig),
      },
      apiFiles,
    },
    results: {
      ...Object.fromEntries(
        scenarios.map(({ name }) => [
          name,
          {
            samples: samples[name],
            medianMs: median(samples[name].map((sample) => sample.msPerCorpus)),
            outputSha256: expected[name],
          },
        ])
      ),
      "api-to-markdown": {
        samples: apiSamples,
        medianMs: median(apiSamples.map((sample) => sample.elapsedMs)),
      },
    },
  }
  await fs.writeFile(process.argv[2], `${JSON.stringify(report, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        guides: guides.length,
        blocks: blocks.length,
        results: Object.fromEntries(
          Object.entries(report.results).map(([name, value]) => [name, value.medianMs])
        ),
        api: apiSamples[0],
      },
      null,
      2
    )
  )
}
