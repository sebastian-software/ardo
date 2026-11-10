import fs from "node:fs"
import path from "node:path"
import type { ImagesConfig } from "../images/types"
import type { ResolvedConfig } from "../config/types"
import { type ContentSourceMapping, resolveContentSourceTarget } from "./content-sources"
import type { PrepareRouteImages } from "./mdx-compile"
import type { ImageSession } from "./image-session"
import { collectImageInputs } from "./image-references"
import { resolveImagesConfig } from "../config/images"
import type { PublicationPostBinding } from "./publication-routes"
import { prepareImage } from "./image-pipeline"

export function preparePageImages(input: {
  file: string
  config: ResolvedConfig
  options: ImagesConfig
  session: ImageSession
  content: ContentSourceMapping[]
  routesDir: string
}): PrepareRouteImages {
  return async ({ prepared, frontmatter }) => {
    const result = Object.create(null)
    const sourceFile = originalFile(input)
    for (const [src, image] of collectImageInputs({
      data: frontmatter,
      prepared,
      markdown: input.config.markdown,
    })) {
      if (/^(?:https?:)?\/\//iu.test(src)) continue
      result[src] = await prepareImage({
        image,
        sourceFile,
        root: input.config.root,
        base: input.config.deploymentBase,
        config: input.options,
        ...input.session,
      })
    }
    return result
  }
}

/** Materialized content retains image paths relative to its canonical Markdown source. */
function originalFile(input: {
  file: string
  config: ResolvedConfig
  content: ContentSourceMapping[]
  routesDir: string
}): string {
  for (const source of input.content) {
    const target = resolveContentSourceTarget(input.routesDir, source.to)
    const relative = path.relative(target, input.file)
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue
    const from = path.resolve(input.config.root, source.from)
    return fs.statSync(from).isDirectory() ? path.join(from, relative) : from
  }
  return input.file
}

export function pageImagesContext(input: {
  state: {
    resolvedConfig?: ResolvedConfig
    routesDir: string
    command?: "serve" | "build"
    publicationPost?: (file: string) => PublicationPostBinding | undefined
  }
  file: string
  options?: ImagesConfig
  legacy?: ImagesConfig
  session: ImageSession
  content: ContentSourceMapping[]
}): { prepareImages?: PrepareRouteImages; imageDependencies?: Set<string> } {
  const { state, file } = input
  if (
    input.options == null ||
    state.resolvedConfig == null ||
    state.publicationPost?.(file) != null
  )
    return {}
  return {
    imageDependencies: input.session.dependencies,
    prepareImages: preparePageImages({
      ...input,
      config: state.resolvedConfig,
      routesDir: state.routesDir,
      options: {
        ...resolveImagesConfig(input.options, input.legacy),
        ...(state.command === "serve" ? { provider: undefined } : {}),
      },
    }),
  }
}
