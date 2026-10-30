import type { DocumentReference } from "ferromark"
import type { ResolvedConfig } from "../config/types"
import type { Post } from "../publication/types"
import { prepareNativeMarkdown } from "../markdown/native-metadata"
import { resolveArdoHref } from "../runtime/page-context"
import { createCurrentRouteIdentity } from "./route-identity"

type Span = { start: number; end: number }
type Replacement = Span & { value: string }
type LinkContext = { post: Post; config: ResolvedConfig }

/** Use native UTF-8 spans; code samples, Unicode, and nested image labels remain intact. */
export function rewritePortableReferences(markdown: string, context: LinkContext): Buffer {
  const bytes = Buffer.from(markdown)
  const refs = prepareNativeMarkdown(markdown, "md", {
    ...context.config.markdown,
    trackReferences: true,
  }).prepared.collectReferences()
  const images = refs.flatMap((reference) => imageReplacement(reference, context.post))
  const links = refs.flatMap((reference) =>
    linkReplacement(reference, { bytes, images, ...context })
  )
  const replacements = [...images, ...links]
  const outer = replacements.filter(
    (entry) => !replacements.some((parent) => parent.start < entry.start && parent.end >= entry.end)
  )
  return replaceRanges(bytes, outer)
}

function imageReplacement(reference: DocumentReference, post: Post): Replacement[] {
  if (reference.kind !== "image" || reference.span == null) return []
  const rendition = post.images[reference.destination]?.families[0]?.renditions.at(-1)
  const destination = rendition?.src ?? reference.destination
  if (rendition == null && !/^(?:https?:)?\/\//iu.test(destination))
    throw new Error(`Feed image ${destination} in post ${post.id} has no prepared local image.`)
  const url = new URL(destination, post.url).href
  const alt = (reference.text ?? "").replaceAll(/([\\[\]])/gu, "\\$1")
  return [{ ...reference.span, value: `![${alt}](<${url}>)` }]
}

function linkReplacement(
  reference: DocumentReference,
  context: LinkContext & { bytes: Buffer; images: Replacement[] }
): Replacement[] {
  const span = reference.span
  if (
    reference.kind !== "link" ||
    span == null ||
    /^[a-z][\d+.a-z-]*:/iu.test(reference.destination) ||
    reference.destination.startsWith("//")
  )
    return []
  const original = context.bytes.subarray(span.start, span.end).toString()
  const end = labelClosingBracket(original)
  if (end < 0) return []
  const children = context.images
    .filter((entry) => entry.start > span.start && entry.end < span.end)
    .map((entry) => ({ ...entry, start: entry.start - span.start, end: entry.end - span.start }))
  const label = replaceRanges(Buffer.from(original.slice(0, end + 1)), children)
  return [
    { ...span, value: `${label.toString()}(<${portableLink(reference.destination, context)}>)` },
  ]
}

function portableLink(destination: string, context: LinkContext): string {
  if (/^[#?]/u.test(destination)) return new URL(destination, context.post.url).href
  const logical = resolveArdoHref(destination, { base: "/", path: context.post.path })
  const suffixIndex = logical.search(/[?#]/u)
  const pathname = suffixIndex < 0 ? logical : logical.slice(0, suffixIndex)
  const suffix = suffixIndex < 0 ? "" : logical.slice(suffixIndex)
  const basePath = mountedPath(pathname, context.config)
    ? pathname
    : localPublicPath(pathname, context)
  const publicPath = pathname.endsWith("/") && !basePath.endsWith("/") ? `${basePath}/` : basePath
  return new URL(`${publicPath}${suffix}`, context.post.url).href
}

function localPublicPath(pathname: string, { post, config }: LinkContext): string {
  const segments = pathname.split("/").filter(Boolean)
  const localeIds = config.i18n === false ? [] : config.i18n.locales.map((locale) => locale.id)
  const explicit = localeIds.includes(segments[0]) ? segments[0] : undefined
  const localeId = explicit ?? localeIds.find((locale) => locale === post.path.split("/")[1])
  return createCurrentRouteIdentity(
    explicit == null ? pathname : `/${segments.slice(1).join("/")}`,
    config,
    { localeId }
  ).publicPath
}

function mountedPath(pathname: string, config: ResolvedConfig): boolean {
  const bases = [
    config.deploymentBase,
    ...(config.versioning === false
      ? []
      : config.versioning.versions.map((version) => version.path)),
  ]
  return bases.some((base) => base !== "/" && pathname.startsWith(base))
}

function replaceRanges(bytes: Buffer, replacements: Replacement[]): Buffer {
  let result = bytes
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    result = Buffer.concat([
      result.subarray(0, replacement.start),
      Buffer.from(replacement.value),
      result.subarray(replacement.end),
    ])
  return result
}

function labelClosingBracket(value: string): number {
  let depth = 0
  for (let index = 0; index < value.length; index++) {
    if (value[index] === "\\") index++
    else if (value[index] === "[") depth++
    else if (value[index] === "]" && --depth === 0) return index
  }
  return -1
}
