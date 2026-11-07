import type { JsxModuleMap, JsxModuleResult } from "ferromark"

import type { ArdoConfig, PageFrontmatter } from "../config/types"

import {
  createNativeMarkdownMetadata,
  type NativeMarkdownFormat,
  type NativeMarkdownMetadata,
  prepareNativeMarkdown,
} from "../markdown/native-metadata"
import { buildToc } from "../markdown/toc"
import { parsePageFrontmatterMetadata } from "./page-metadata"

/** What the document's ESM exports and binds at the top level, as Ferromark reports it. */
type AuthoredScope = { bindings: Set<string>; exports: Set<string> }

/**
 * Names the code appended to Ferromark's module declares. Ferromark rejects an
 * authored declaration of one of them, so no pass over the document is needed
 * to find free names.
 */
const routeBindings = ["_ArdoPageDataProvider", "_ardoFrontmatter", "_ardoRoute", "_ardoToc"]

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
  /** URL of the page's Markdown file, when the build writes one for this route. */
  pageMarkdownPath?: string
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
    code:
      result.code +
      createRouteCode({
        markdownConfig: input.markdownConfig,
        metadata,
        id: input.id,
        pageMarkdownPath: input.pageMarkdownPath,
        result,
      }),
    map: result.map,
  }
}

function createRouteCode(input: {
  id: string
  markdownConfig: ArdoConfig["markdown"]
  metadata: NativeMarkdownMetadata
  pageMarkdownPath: string | undefined
  result: JsxModuleResult
}): string {
  const scope: AuthoredScope = {
    bindings: new Set(input.result.bindings),
    exports: new Set(input.result.exports),
  }
  const toc = buildToc(input.metadata.headings, input.markdownConfig?.toc?.level ?? [2, 3])
  const frontmatter = scope.bindings.has("frontmatter")
    ? "frontmatter"
    : JSON.stringify(input.metadata.frontmatter)
  // `llms: false` removes the page's Markdown file, so the page has no link to it either.
  const markdownPath =
    input.pageMarkdownPath != null &&
    parsePageFrontmatterMetadata(input.metadata.frontmatter).llms !== false
      ? ` markdownPath={${JSON.stringify(input.pageMarkdownPath)}}`
      : ""
  const lines = [
    `import { ArdoPageDataProvider as _ArdoPageDataProvider } from "ardo/runtime";`,
    `const _ardoFrontmatter = ${frontmatter};`,
    `const _ardoToc = ${JSON.stringify(toc)};`,
    ...createDataExport("frontmatter", "_ardoFrontmatter", scope),
    ...createDataExport("toc", "_ardoToc", scope),
    ...createHandleExport(input.metadata.frontmatter, scope),
    ...createMetaExport(input.metadata.frontmatter, scope, input.id),
    `function _ardoRoute(props = {}) {`,
    `  return <_ArdoPageDataProvider frontmatter={_ardoFrontmatter} toc={_ardoToc}${markdownPath}><MDXContent {...props} /></_ArdoPageDataProvider>;`,
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

/**
 * A generated publication route carries the site's complete metadata in `_ardoMeta`. Exporting
 * it as `meta` replaces the metadata Ardo would derive, so canonical and social tags never repeat.
 */
function createMetaExport(
  frontmatter: PageFrontmatter,
  scope: AuthoredScope,
  id: string
): string[] {
  const meta = frontmatter._ardoMeta
  if (!Array.isArray(meta)) return []
  if (scope.exports.has("meta") || scope.bindings.has("meta"))
    throw new Error(
      `[ardo] ${id} declares its own meta, but publication.meta.post supplies the metadata of every post. Remove one of them.`
    )
  return [`export const meta = () => ${JSON.stringify(meta)};`]
}

function createHandleExport(frontmatter: PageFrontmatter, scope: AuthoredScope): string[] {
  const { layout, fullWidth, contentWidth } = frontmatter
  const handle = {
    ...(layout === "bare" || layout === "default" ? { layout } : {}),
    ...(typeof fullWidth === "boolean" ? { fullWidth } : {}),
    ...(contentWidth === "reading" || contentWidth === "page" ? { contentWidth } : {}),
  }
  if (Object.keys(handle).length === 0 || scope.exports.has("handle")) return []
  if (scope.bindings.has("handle")) return ["export { handle };"]
  return [`export const handle = ${JSON.stringify(handle)};`]
}
