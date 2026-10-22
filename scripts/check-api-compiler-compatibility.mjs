import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

if (
  process.argv.length !== 4 ||
  !process.env.ARDO_DECLARATION_TSC ||
  !process.env.ARDO_JAVASCRIPT_TSC
)
  throw new Error(
    "Set ARDO_DECLARATION_TSC (native TypeScript 7) and ARDO_JAVASCRIPT_TSC (TypeScript 6); usage: node scripts/check-api-compiler-compatibility.mjs PROFILES.json OUTPUT.json"
  )
const profileFile = path.resolve(process.argv[2])
const profiles = JSON.parse(await fs.readFile(profileFile, "utf8"))
const compilers = [
  { name: "native", executable: process.env.ARDO_DECLARATION_TSC },
  { name: "javascript", executable: process.env.ARDO_JAVASCRIPT_TSC },
].map((compiler) => ({
  ...compiler,
  version: execFileSync(compiler.executable, ["--version"], { encoding: "utf8" }).trim(),
}))
if (!/^Version 7\./u.test(compilers[0].version) || !/^Version 6\./u.test(compilers[1].version)) {
  throw new Error(
    "Compiler comparison requires a native TypeScript 7 executable and a JavaScript TypeScript 6 executable."
  )
}
const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ardo-compiler-compatibility-"))
const report = { recordedAt: new Date().toISOString(), node: process.version, profiles: [] }
try {
  for (const [index, profile] of profiles.entries()) {
    const sourceRoot = path.resolve(path.dirname(profileFile), profile.sourceRoot)
    const baseConfig = path.resolve(path.dirname(profileFile), profile.config)
    const compilerOptions = {
      rootDir: sourceRoot,
      noEmit: false,
      declaration: true,
      declarationMap: true,
      emitDeclarationOnly: true,
      noEmitOnError: true,
      incremental: false,
      removeComments: false,
    }
    const results = []
    for (const compiler of compilers) {
      const output = path.join(directory, `${index}-${compiler.name}`)
      const config = path.join(directory, `${index}-${compiler.name}.json`)
      await fs.writeFile(
        config,
        JSON.stringify({
          extends: baseConfig,
          compilerOptions: { ...compilerOptions, outDir: output, declarationDir: output },
          files: [path.resolve(path.dirname(profileFile), profile.entry)],
          include: [],
        })
      )
      let exitCode = 0
      let diagnostics = ""
      try {
        diagnostics = execFileSync(
          compiler.executable,
          ["--project", config, "--pretty", "false"],
          {
            cwd: path.dirname(sourceRoot),
            encoding: "utf8",
            timeout: 60_000,
          }
        )
      } catch (error) {
        if (!Number.isInteger(error.status)) throw error
        exitCode = error.status
        diagnostics = error.stdout
      }
      results.push({ name: compiler.name, version: compiler.version, exitCode, diagnostics })
    }
    report.profiles.push({
      name: profile.name,
      provenance: profile.provenance,
      baseConfig: JSON.parse(await fs.readFile(baseConfig, "utf8")),
      compilerOptions,
      results,
    })
  }
  await fs.writeFile(path.resolve(process.argv[3]), `${JSON.stringify(report, null, 2)}\n`)
} finally {
  await fs.rm(directory, { recursive: true, force: true })
}
