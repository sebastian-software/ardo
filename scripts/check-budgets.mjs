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
  totalJsGzip: {
    label: "total client JS gzip",
    budget: 340_000,
    baseline: "≈257 KB (2026-07)",
  },
  searchIndexGzip: {
    label: "search index gzip",
    budget: 60_000,
    baseline: "≈14 KB (2026-07)",
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

  const results = [
    { key: "entryClientGzip", value: await measureEntryClient(jsFiles), format: formatBytes },
    { key: "totalJsGzip", value: await measureTotalJs(jsFiles), format: formatBytes },
    { key: "searchIndexGzip", value: searchIndex.gzip, format: formatBytes },
  ]
  if (buildDurationMs != null) {
    results.push({ key: "buildDurationMs", value: buildDurationMs, format: formatMs })
  }

  console.log(`[budgets] search index: ${searchIndex.docCount} documents`)
  console.log(`[budgets] client JS files: ${jsFiles.length}\n`)

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
