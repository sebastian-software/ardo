import type { JsxModuleMap, JsxModuleResult } from "ferromark"

import type { ArdoConfig } from "../config/types"

import {
  createNativeMarkdownMetadata,
  type NativeMarkdownFormat,
  type NativeMarkdownMetadata,
  prepareNativeMarkdown,
} from "../markdown/native-metadata"
import { buildToc } from "../markdown/toc"

/** What the document's ESM exports and binds at the top level, as Ferromark reports it. */
type AuthoredScope = { bindings: Set<string>; exports: Set<string> }

/**
 * Names the code appended to Ferromark's module declares. Ferromark rejects an
 * authored declaration of one of them, so no pass over the document is needed
 * to find free names.
 */
const routeBindings = [
  "_ArdoMermaid",
  "_ArdoPageDataProvider",
  "_ardoFrontmatter",
  "_ardoRoute",
  "_ardoToc",
]

/**
 * Compile a Markdown or MDX route with Ferromark's MDX module output and append
 * Ardo's route exports. Ferromark owns the module contract: authored ESM, the
 * layout, component resolution, and the source map. Appended imports are
 * hoisted, so `result.map` stays valid for the whole module.
 */
export function compileMdxRouteModule(input: {
  format: NativeMarkdownFormat
  id: string
  markdownConfig: ArdoConfig["markdown"]
  source: string
}): { code: string; map: JsxModuleMap } {
  const { prepared, frontmatter, renderOptions } = prepareNativeMarkdown(
    input.source,
    input.format,
    input.markdownConfig
  )
  const { componentPrefix: _componentPrefix, ...moduleOptions } = renderOptions
  const result = prepared.renderModule({
    ...moduleOptions,
    codeBlockComponent: "_components.CodeBlock",
    providerImportSource: "ardo/mdx-provider",
    filename: input.id,
    defaultExport: false,
    reservedBindings: routeBindings,
  })
  const metadata = createNativeMarkdownMetadata(input.source, frontmatter, result)
  return {
    code: result.code + createRouteCode({ markdownConfig: input.markdownConfig, metadata, result }),
    map: result.map,
  }
}

function createRouteCode(input: {
  markdownConfig: ArdoConfig["markdown"]
  metadata: NativeMarkdownMetadata
  result: JsxModuleResult
}): string {
  const scope: AuthoredScope = {
    bindings: new Set(input.result.bindings),
    exports: new Set(input.result.exports),
  }
  const toc = buildToc(input.metadata.headings, input.markdownConfig?.toc?.level ?? [2, 3])
  const usesMermaid = input.result.codeBlocks.some(
    (block) => block.language?.toLowerCase() === "mermaid"
  )
  const frontmatter = scope.bindings.has("frontmatter")
    ? "frontmatter"
    : JSON.stringify(input.metadata.frontmatter)
  const lines = [
    `import { ArdoPageDataProvider as _ArdoPageDataProvider } from "ardo/runtime";`,
    ...(usesMermaid ? [`import { ArdoMermaid as _ArdoMermaid } from "ardo/ui";`] : []),
    `const _ardoFrontmatter = ${frontmatter};`,
    `const _ardoToc = ${JSON.stringify(toc)};`,
    ...createDataExport("frontmatter", "_ardoFrontmatter", scope),
    ...createDataExport("toc", "_ardoToc", scope),
    ...createHandleExport(input.metadata.frontmatter.layout, scope),
    `function _ardoRoute(props = {}) {`,
    `  return <_ArdoPageDataProvider frontmatter={_ardoFrontmatter} toc={_ardoToc}><MDXContent {...props} /></_ArdoPageDataProvider>;`,
    `}`,
    `export default _ardoRoute;`,
  ]
  return `\n${lines.join("\n")}\n`
}

/** Export Ardo's value unless the document exports or binds the name itself. */
function createDataExport(
  name: "frontmatter" | "toc",
  local: string,
  scope: AuthoredScope
): string[] {
  if (scope.exports.has(name)) return []
  if (scope.bindings.has(name)) return [`export { ${name} };`]
  return [`export { ${local} as ${name} };`]
}

function createHandleExport(layout: unknown, scope: AuthoredScope): string[] {
  if ((layout !== "bare" && layout !== "default") || scope.exports.has("handle")) return []
  if (scope.bindings.has("handle")) return ["export { handle };"]
  return [`export const handle = ${JSON.stringify({ layout })};`]
}
