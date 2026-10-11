import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { generateDeclarationDocs } from "ardo/api"

const cwd = fileURLToPath(new URL(".", import.meta.url))
const arguments_ = process.argv.slice(2)
const workspaceCompiler = arguments_.length === 1 && arguments_[0] === "--workspace-compiler"
if (arguments_.length > 0 && !workspaceCompiler)
  throw new Error("Usage: node prebuild-declarations.mjs [--workspace-compiler]")
const compiler =
  process.env.ARDO_DECLARATION_TSC ??
  (workspaceCompiler
    ? fileURLToPath(new URL("../../node_modules/typescript/bin/tsc", import.meta.url))
    : "tsc")
const version = execFileSync(compiler, ["--version"], { cwd, encoding: "utf8" }).trim()
if (!workspaceCompiler && !/^Version 7\./u.test(version)) {
  throw new Error(
    "This prototype uses native TypeScript 7. Set ARDO_DECLARATION_TSC to its tsc executable."
  )
}

const compilerFiles = execFileSync(
  compiler,
  ["--project", "tsconfig.declarations.json", "--listFiles"],
  { cwd, encoding: "utf8" }
).split(/\r?\n/u)
const coreLib = compilerFiles.find((file) => path.basename(file) === "lib.es5.d.ts")
const libFiles = compilerFiles.filter(
  (file) => coreLib != null && path.dirname(file) === path.dirname(coreLib)
)
const result = await generateDeclarationDocs(
  {
    entryPoints: [fileURLToPath(new URL(".api-declarations/index.d.ts", import.meta.url))],
    out: "api-declarations",
    title: "API Reference from Declarations",
    libFiles,
  },
  fileURLToPath(new URL("app/routes", import.meta.url))
)

for (const diagnostic of result.diagnostics) {
  console.warn(`[ardo:api] ${diagnostic.file}: ${diagnostic.message}`)
}
console.log(
  `[ardo:api] ${version}: generated ${result.pages.length} pages for ${result.items.length} exports.`
)
