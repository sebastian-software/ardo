import type { DeclarationDocsConfig, DeclarationDocsResult } from "./types"

import { resolveGeneratedDocsDirectory, writeGeneratedDocs } from "../generated-docs"
import { extractDeclarations } from "./extractor"
import { renderDeclarationDocs } from "./renderer"

/** Generate Markdown from existing declaration files. This does not run a compiler. */
export async function generateDeclarationDocs(
  config: DeclarationDocsConfig,
  routesDir: string
): Promise<DeclarationDocsResult> {
  const out = config.out ?? "api-reference"
  resolveGeneratedDocsDirectory(routesDir, out, "api.out")
  const project = await extractDeclarations(config.entryPoints)
  const pages = renderDeclarationDocs(project.items, out, config.title ?? "API Reference")
  await writeGeneratedDocs({ outputDir: routesDir, out, configKey: "api.out" }, pages)
  return { ...project, pages }
}
