import { fileURLToPath } from "node:url"
import { generateNativeDocs } from "ardo/api"

const result = await generateNativeDocs(
  {
    entryPoints: [fileURLToPath(new URL("src/index.ts", import.meta.url))],
    tsconfig: fileURLToPath(new URL("tsconfig.api.json", import.meta.url)),
    out: "api-reference",
  },
  fileURLToPath(new URL("app/routes", import.meta.url))
)

for (const diagnostic of result.diagnostics) {
  console.warn(`[ardo:api] ${diagnostic.file}: ${diagnostic.message}`)
}
console.log(`[ardo:api] Generated ${result.pages.length} pages for ${result.items.length} exports.`)
