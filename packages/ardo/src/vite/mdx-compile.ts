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
import type { PublicationPostBinding } from "./publication-routes"

/** What the document's ESM exports and binds at the top level, as Ferromark reports it. */
type AuthoredScope = { bindings: Set<string>; exports: Set<string> }

/**
 * Names the code appended to Ferromark's module declares. Ferromark rejects an
 * authored declaration of one of them, so no pass over the document is needed
 * to find free names.
 */
const routeBindings = [
  "_ArdoPageDataProvider",
  "_ArdoPostFrame",
  "_ArdoPublicationTags",
  "_ardoFrontmatter",
  "_ardoPostMeta",
  "_ardoPostView",
  "_ardoPublications",
  "_ardoRoute",
  "_ardoTagArchive",
  "_ardoTagLabel",
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
  /** URL of the page's Markdown file, when the build writes one for this route. */
  pageMarkdownPath?: string
  /** Set for a generated publication post: the frame and modules the route mounts. */
  publicationPost?: PublicationPostBinding
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
        pageMarkdownPath: input.pageMarkdownPath,
        publicationPost: input.publicationPost,
        result,
      }),
    map: result.map,
  }
}

function createRouteCode(input: {
  markdownConfig: ArdoConfig["markdown"]
  metadata: NativeMarkdownMetadata
  pageMarkdownPath: string | undefined
  publicationPost: PublicationPostBinding | undefined
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
  const post = input.publicationPost
  const content =
    post == null
      ? "<MDXContent {...props} />"
      : "<_ArdoPublicationTags label={_ardoTagLabel} archive={_ardoTagArchive}><_ArdoPostFrame post={_ardoFrontmatter._ardoPost}><MDXContent {...props} /></_ArdoPostFrame></_ArdoPublicationTags>"
  const lines = [
    `import { ArdoPageDataProvider as _ArdoPageDataProvider } from "ardo/runtime";`,
    ...(post == null ? [] : createPostFrameCode(post)),
    `const _ardoFrontmatter = ${frontmatter};`,
    `const _ardoToc = ${JSON.stringify(toc)};`,
    ...createDataExport("frontmatter", "_ardoFrontmatter", scope),
    ...createDataExport("toc", "_ardoToc", scope),
    ...createHandleExport(input.metadata.frontmatter, scope),
    `function _ardoRoute(props = {}) {`,
    `  return <_ArdoPageDataProvider frontmatter={_ardoFrontmatter} toc={_ardoToc}${markdownPath}>${content}</_ArdoPageDataProvider>;`,
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
 * A generated publication post mounts its frame here rather than in the global MDX wrapper, so the
 * site's post module is part of post routes only. `_ardoPostMeta` lets the site module's `meta`
 * export extend or replace the metadata that `transformMarkdownMeta` derives for the post.
 */
function createPostFrameCode(post: PublicationPostBinding): string[] {
  const view = post.view
  return [
    view == null
      ? `import { ArdoPost as _ArdoPostFrame, ArdoPublicationTags as _ArdoPublicationTags } from "ardo/ui";`
      : `import { ArdoPublicationTags as _ArdoPublicationTags } from "ardo/ui";`,
    ...(view == null
      ? []
      : [
          `import * as _ardoPostView from ${JSON.stringify(view)};`,
          `import { publications as _ardoPublications } from "virtual:ardo/publication";`,
          `const _ArdoPostFrame = _ardoPostView.default;`,
        ]),
    post.tagLabel == null
      ? "const _ardoTagLabel = undefined;"
      : `import _ardoTagLabel from ${JSON.stringify(post.tagLabel)};`,
    `const _ardoTagArchive = ${JSON.stringify(post.tagArchive)};`,
    ...(view == null
      ? []
      : [
          "function _ardoPostMeta(defaults) {",
          "  const meta = _ardoPostView.meta;",
          `  return meta == null ? defaults : meta({ publication: _ardoPublications[${JSON.stringify(post.publication)}], post: _ardoFrontmatter._ardoPost, defaults });`,
          "}",
        ]),
  ]
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
