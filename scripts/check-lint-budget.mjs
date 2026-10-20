import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"

/** oxlint reports `plugin(rule)`; budgets use the `plugin/rule` spelling, core rules bare. */
export function ruleName(code) {
  const match = /^([\w-]+)\((.+)\)$/.exec(code ?? "")
  if (match == null) return code ?? "unknown"
  return match[1] === "eslint" ? match[2] : `${match[1]}/${match[2]}`
}

export function auditLintResults(diagnostics, budgets) {
  const counts = new Map()
  let errorCount = 0
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") errorCount++
    if (diagnostic.severity === "warning") {
      const rule = ruleName(diagnostic.code)
      counts.set(rule, (counts.get(rule) ?? 0) + 1)
    }
  }
  const exceeded = new Set(
    [...counts]
      .filter(([rule, count]) => count > (Object.hasOwn(budgets, rule) ? budgets[rule] : 0))
      .map(([rule]) => rule)
  )
  return { counts, exceeded, errorCount, passed: errorCount === 0 && exceeded.size === 0 }
}

async function main() {
  const budgets = JSON.parse(
    await fs.readFile(new URL("./lint-warning-budget.json", import.meta.url), "utf8")
  )
  const require = createRequire(import.meta.url)
  const oxlintCli = path.join(path.dirname(require.resolve("oxlint/package.json")), "bin/oxlint")
  const sources = []
  for (const name of await fs.readdir("packages")) {
    if (name.startsWith(".")) continue
    const source = path.join("packages", name, "src")
    try {
      if ((await fs.stat(source)).isDirectory()) sources.push(source)
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error
    }
  }
  if (sources.length === 0) throw new Error("No package source directories found")
  const run = spawnSync(
    process.execPath,
    [oxlintCli, "--type-aware", "--format=json", ...sources.sort()],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  )
  if (run.error || run.status == null || run.status > 1) {
    throw run.error ?? new Error(run.stderr || "oxlint did not complete")
  }
  const { diagnostics } = JSON.parse(run.stdout)
  const audit = auditLintResults(diagnostics, budgets)
  for (const [rule, count] of [...audit.counts].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    console.log(
      `${rule}: ${count}/${budgets[rule] ?? 0}${audit.exceeded.has(rule) ? " EXCEEDED" : ""}`
    )
  }
  for (const diagnostic of diagnostics) {
    const rule = ruleName(diagnostic.code)
    if (diagnostic.severity !== "error" && !audit.exceeded.has(rule)) continue
    const span = diagnostic.labels?.[0]?.span
    console.error(
      `${diagnostic.filename}:${span?.line ?? 0}:${span?.column ?? 0} ${rule}: ${diagnostic.message}`
    )
  }
  const warnings = [...audit.counts.values()].reduce((sum, count) => sum + count, 0)
  console.log(
    `Lint: ${audit.errorCount} errors, ${warnings} warnings; budget ${audit.passed ? "passed" : "failed"}.`
  )
  console.log("Run pnpm lint:raw for every warning location.")
  process.exitCode = audit.passed ? 0 : 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
