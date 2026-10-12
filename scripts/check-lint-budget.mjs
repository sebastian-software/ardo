import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"

export function auditLintResults(results, budgets) {
  const counts = new Map()
  let errorCount = 0
  for (const result of results) {
    for (const message of result.messages) {
      if (message.severity === 2) errorCount++
      if (message.severity === 1) {
        const rule = message.ruleId ?? "unknown"
        counts.set(rule, (counts.get(rule) ?? 0) + 1)
      }
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
  const eslintCli = path.join(path.dirname(require.resolve("eslint/package.json")), "bin/eslint.js")
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
  const run = spawnSync(process.execPath, [eslintCli, ...sources.sort(), "--format", "json"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  })
  if (run.error || run.status == null || run.status > 1) {
    throw run.error ?? new Error(run.stderr || "ESLint did not complete")
  }
  const results = JSON.parse(run.stdout)
  const audit = auditLintResults(results, budgets)
  for (const [rule, count] of [...audit.counts].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    console.log(
      `${rule}: ${count}/${budgets[rule] ?? 0}${audit.exceeded.has(rule) ? " EXCEEDED" : ""}`
    )
  }
  const failures = results
    .map((result) => ({
      ...result,
      messages: result.messages.filter(
        (message) => message.severity === 2 || audit.exceeded.has(message.ruleId ?? "unknown")
      ),
    }))
    .filter((result) => result.messages.length > 0)
  if (failures.length > 0) {
    for (const result of failures) {
      for (const message of result.messages) {
        console.error(
          `${result.filePath}:${message.line}:${message.column} ${message.ruleId ?? "parser"}: ${message.message}`
        )
      }
    }
  }
  const warnings = [...audit.counts.values()].reduce((sum, count) => sum + count, 0)
  console.log(
    `Lint: ${audit.errorCount} errors, ${warnings} warnings; budget ${audit.passed ? "passed" : "failed"}.`
  )
  console.log("Run pnpm lint:raw for every warning location.")
  process.exitCode = audit.passed ? 0 : 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
