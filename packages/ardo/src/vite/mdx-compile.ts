import type { CodeHooks, JsxModuleMap, JsxModuleResult } from "ferromark"

import type { PostImage } from "../images/types"
import type { ArdoConfig, PageFrontmatter } from "../config/types"

import {
  createNativeMarkdownMetadata,
  type NativeMarkdownFormat,
  type NativeMarkdownMetadata,
  prepareNativeMarkdown,
} from "../markdown/native-metadata"
import { getArdoCodeHooks } from "../markdown/code-hooks"
import { buildToc } from "../markdown/toc"
import { parsePageFrontmatterMetadata } from "./page-metadata"
import type { PublicationPostBinding } from "./publication-routes"
import { FREEZE_SOURCE } from "./publication-freeze"

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
  "_ardoFreeze",
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
export function compileMdxRouteModule(input: MdxRouteInput): { code: string; map: JsxModuleMap } {
  return renderMdxRouteModule(input, prepareMdxRoute(input))
}

/** Compile a route with highlighting and, when configured, Mermaid diagrams. */
export async function compileMdxRouteModuleWithCode(
  input: MdxRouteInput
): Promise<{ code: string; map: JsxModuleMap }> {
  const route = prepareMdxRoute(input)
  const codeHooks = await getArdoCodeHooks(input.markdownConfig, {
    languages: route.prepared.metadata.codeBlocks.map((block) => block.language),
    source: input.source,
    sourcePath: input.id,
  })
  const images = await input.prepareImages?.(route)
  return renderMdxRouteModule(input, route, { codeHooks, images })
}

export type PrepareRouteImages = (
  route: ReturnType<typeof prepareMdxRoute>
) => Promise<Record<string, PostImage>>

type MdxRouteInput = {
  prepareImages?: PrepareRouteImages
  format: NativeMarkdownFormat
  id: string
  markdownConfig: ArdoConfig["markdown"]
  /** URL of the page's Markdown file, when the build writes one for this route. */
  pageMarkdownPath?: string
  /** Set for a generated publication post: the frame and modules the route mounts. */
  publicationPost?: PublicationPostBinding
  source: string
}

function prepareMdxRoute(input: MdxRouteInput) {
  return prepareNativeMarkdown(
    input.source,
    input.format,
    input.prepareImages == null
      ? input.markdownConfig
      : { ...input.markdownConfig, trackReferences: true }
  )
}

function renderMdxRouteModule(
  input: MdxRouteInput,
  { prepared, frontmatter, renderOptions }: ReturnType<typeof prepareMdxRoute>,
  { codeHooks, images }: { codeHooks?: CodeHooks; images?: Record<string, PostImage> } = {}
): { code: string; map: JsxModuleMap } {
  const { componentPrefix: _componentPrefix, ...moduleOptions } = renderOptions
  const result = prepared.renderModule(
    {
      ...moduleOptions,
      codeBlockComponent: "_components.CodeBlock",
      providerImportSource: "ardo/mdx-provider",
      filename: input.id,
      defaultExport: false,
      reservedBindings:
        input.prepareImages == null ? routeBindings : [...routeBindings, "_ardoImages"],
    },
    codeHooks
  )
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
        images,
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
  images?: Record<string, PostImage>
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
  if (post?.view != null && (scope.exports.has("meta") || scope.bindings.has("meta")))
    throw new Error(
      `[ardo] ${post.sourceFile} exports meta, but publication.components.post supplies the metadata of every post, and a post's own meta would drop its canonical, Open Graph, and feed links. Remove the post's meta export; to vary a post's metadata, read its fields in the post module's meta.`
    )
  const content =
    post == null
      ? "<MDXContent {...props} />"
      : "<_ArdoPublicationTags label={_ardoTagLabel} archive={_ardoTagArchive}><_ArdoPostFrame post={_ardoFrontmatter._ardoPost}><MDXContent {...props} /></_ArdoPostFrame></_ArdoPublicationTags>"
  const lines = [
    `import { ArdoPageDataProvider as _ArdoPageDataProvider } from "ardo/runtime";`,
    ...(post == null ? [] : createPostFrameCode(post)),
    `const _ardoFrontmatter = ${frontmatter};`,
    ...(post == null ? [] : ["_ardoFreeze(_ardoFrontmatter._ardoPost);"]),
    ...(input.images == null || Object.keys(input.images).length === 0
      ? []
      : [`const _ardoImages = ${JSON.stringify(input.images)};`]),
    `const _ardoToc = ${JSON.stringify(toc)};`,
    ...createDataExport("frontmatter", "_ardoFrontmatter", scope),
    ...createDataExport("toc", "_ardoToc", scope),
    ...createHandleExport(input.metadata.frontmatter, scope),
    `function _ardoRoute(props = {}) {`,
    `  return <_ArdoPageDataProvider frontmatter={_ardoFrontmatter} toc={_ardoToc}${markdownPath}${input.images == null || Object.keys(input.images).length === 0 ? "" : " images={_ardoImages}"}>${content}</_ArdoPageDataProvider>;`,
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
    // Shared with the frame and `meta`; frozen so a mutation cannot change what either renders.
    `${FREEZE_SOURCE}`,
    "function _ardoPostMeta(page) {",
    `  const defaults = [...page, ...${JSON.stringify(post.feeds)}];`,
    ...(view == null
      ? ["  return defaults;"]
      : [
          "  const meta = _ardoPostView.meta;",
          `  return meta == null ? defaults : meta({ publication: _ardoPublications[${JSON.stringify(post.publication)}], post: _ardoFrontmatter._ardoPost, defaults });`,
        ]),
    "}",
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
