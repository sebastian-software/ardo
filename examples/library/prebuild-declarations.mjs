import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { generateDeclarationDocs } from "ardo/api"

const cwd = fileURLToPath(new URL(".", import.meta.url))
const compiler = process.env.ARDO_DECLARATION_TSC ?? "tsc"
const version = execFileSync(compiler, ["--version"], { cwd, encoding: "utf8" }).trim()
if (!/^Version 7\./u.test(version)) {
  throw new Error(
    "This prototype uses native TypeScript 7. Set ARDO_DECLARATION_TSC to its tsc executable."
  )
}

execFileSync(compiler, ["--project", "tsconfig.declarations.json"], { cwd, stdio: "inherit" })
const result = await generateDeclarationDocs(
  {
    entryPoints: [fileURLToPath(new URL(".api-declarations/index.d.ts", import.meta.url))],
    out: "api-declarations",
    title: "API Reference from Declarations",
  },
  fileURLToPath(new URL("app/routes", import.meta.url))
)

for (const diagnostic of result.diagnostics) {
  console.warn(`[ardo:api] ${diagnostic.file}: ${diagnostic.message}`)
}
console.log(
  `[ardo:api] ${version}: generated ${result.pages.length} pages for ${result.items.length} exports.`
)
