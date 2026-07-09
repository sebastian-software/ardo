#!/usr/bin/env node
/**
 * Performance budgets for the Ardo docs site (issue #178).
 *
 * Builds the docs site (unless --no-build is passed), then checks the
 * build output against the budgets below. Exits non-zero when a budget
 * is exceeded, so CI fails on material regressions.
 *
 * Updating budgets: budgets are intentionally generous headroom over the
 * measured baseline (see `baseline` fields), not tight targets. When a
 * deliberate change moves a metric past its budget, re-measure locally
 * with `node scripts/check-budgets.mjs`, update the budget AND baseline
 * here, and explain the increase in the commit message.
 */

import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const clientDir = path.join(repoRoot, "docs", "build", "client")
const routesDir = path.join(repoRoot, "docs", "app", "routes")

/**
 * All sizes are gzip bytes (what actually goes over the wire).
 * Durations are wall-clock milliseconds with deliberately generous caps:
 * CI machines vary, so time budgets only catch pathological regressions.
 */
const budgets = {
  entryClientGzip: {
    label: "entry.client gzip",
    budget: 75_000,
    baseline: "≈56 KB (2026-07)",
  },
  eagerJsGzip: {
    // JS referenced from prerendered HTML (script src + modulepreload):
    // what visitors actually download. Lazy chunks (e.g. Mermaid) are
    // excluded because they only load on pages that use them.
    label: "eager client JS gzip",
    budget: 380_000,
    baseline: "≈309 KB (2026-07, after the v4.0 content growth)",
  },
  totalJsGzip: {
    // Everything emitted, including lazily loaded chunks. Deliberately
    // roomy — this only catches runaway output growth.
    label: "total client JS gzip",
    budget: 1_500_000,
    baseline: "≈1.23 MB (2026-07, ≈930 KB of it lazy Mermaid chunks)",
  },
  searchIndexGzip: {
    label: "search index gzip",
    budget: 80_000,
    baseline: "≈50 KB (2026-07, after the v4.0 content growth)",
  },
  buildDurationMs: {
    label: "docs build duration",
    budget: 300_000,
    baseline: "≈32 s local (2026-07)",
  },
}

async function collectFiles(dir, extension) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, extension)))
    } else if (entry.name.endsWith(extension)) {
      files.push(fullPath)
    }
  }
  return files
}

async function gzipSize(filePath) {
  const content = await readFile(filePath)
  return gzipSync(content).length
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatMs(ms) {
  return `${(ms / 1000).toFixed(1)} s`
}

async function measureEntryClient(jsFiles) {
  const entryFiles = jsFiles.filter((file) => path.basename(file).startsWith("entry.client"))
  if (entryFiles.length === 0) {
    throw new Error(`No entry.client-*.js found in ${clientDir}`)
  }
  const sizes = await Promise.all(entryFiles.map((file) => gzipSize(file)))
  return Math.max(...sizes)
}

async function measureTotalJs(jsFiles) {
  const sizes = await Promise.all(jsFiles.map((file) => gzipSize(file)))
  return sizes.reduce((sum, size) => sum + size, 0)
}

/**
 * Sums the gzip size of every JS file referenced from prerendered HTML
 * via <script src> or <link rel="modulepreload"> — the code visitors
 * actually download. Lazily imported chunks are not referenced in HTML
 * and are therefore excluded.
 */
async function measureEagerJs(jsFiles) {
  const htmlFiles = await collectFiles(clientDir, ".html")
  const referenced = new Set()
  const referencePattern = /(?:src|href)="([^"]+\.js)"/g

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8")
    for (const match of html.matchAll(referencePattern)) {
      referenced.add(path.basename(match[1]))
    }
  }

  const eagerFiles = jsFiles.filter((file) => referenced.has(path.basename(file)))
  if (eagerFiles.length === 0) {
    throw new Error("No JS files referenced from prerendered HTML — check the reference pattern")
  }
  const sizes = await Promise.all(eagerFiles.map((file) => gzipSize(file)))
  return { count: eagerFiles.length, total: sizes.reduce((sum, size) => sum + size, 0) }
}

async function measureSearchIndex() {
  const vitePkg = path.join(repoRoot, "packages", "ardo", "dist", "vite", "index.js")
  if (!existsSync(vitePkg)) {
    throw new Error("packages/ardo/dist is missing — run `pnpm build` first")
  }
  const { generateSearchIndex } = await import(vitePkg)
  const docs = await generateSearchIndex(routesDir)
  const serialized = JSON.stringify(docs)
  return { docCount: docs.length, gzip: gzipSync(Buffer.from(serialized)).length }
}

function runDocsBuild() {
  const start = performance.now()
  execSync("pnpm docs:build", { cwd: repoRoot, stdio: "inherit" })
  return Math.round(performance.now() - start)
}

async function main() {
  const skipBuild = process.argv.includes("--no-build")

  let buildDurationMs
  if (skipBuild) {
    console.log("[budgets] --no-build: reusing existing docs/build output\n")
  } else {
    buildDurationMs = runDocsBuild()
    console.log()
  }

  const clientStat = await stat(clientDir).catch(() => null)
  if (clientStat == null || !clientStat.isDirectory()) {
    throw new Error(`Docs build output not found at ${clientDir} — run \`pnpm docs:build\``)
  }

  const jsFiles = await collectFiles(clientDir, ".js")
  const searchIndex = await measureSearchIndex()
  const eager = await measureEagerJs(jsFiles)

  const results = [
    { key: "entryClientGzip", value: await measureEntryClient(jsFiles), format: formatBytes },
    { key: "eagerJsGzip", value: eager.total, format: formatBytes },
    { key: "totalJsGzip", value: await measureTotalJs(jsFiles), format: formatBytes },
    { key: "searchIndexGzip", value: searchIndex.gzip, format: formatBytes },
  ]
  if (buildDurationMs != null) {
    results.push({ key: "buildDurationMs", value: buildDurationMs, format: formatMs })
  }

  console.log(`[budgets] search index: ${searchIndex.docCount} documents`)
  console.log(`[budgets] client JS files: ${jsFiles.length} (${eager.count} eager)\n`)

  let failed = false
  for (const { key, value, format } of results) {
    const { label, budget } = budgets[key]
    const ok = value <= budget
    const status = ok ? "OK  " : "FAIL"
    const share = ((value / budget) * 100).toFixed(0)
    console.log(`[budgets] ${status} ${label}: ${format(value)} / ${format(budget)} (${share}%)`)
    if (!ok) {
      failed = true
    }
  }

  if (failed) {
    console.error(
      "\n[budgets] Budget exceeded. If this regression is intentional, update" +
        " scripts/check-budgets.mjs (budget + baseline) and explain why in the commit."
    )
    process.exit(1)
  }

  console.log("\n[budgets] All budgets passed.")
}

main().catch((error) => {
  console.error(`[budgets] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
