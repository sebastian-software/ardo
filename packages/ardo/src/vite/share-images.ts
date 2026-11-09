import { createHash } from "node:crypto"
import { readFile, mkdir, writeFile, realpath } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import type { ArdoRenderOptions } from "../entries/server"
import type { ShareImagesConfig } from "../config/share-images"
import type { ArdoMetaDescriptor } from "../runtime/page-context"
import { shareImageColors } from "./share-image-colors"
import { shareImageTitle } from "./share-image-title"
import { defaultShareImage } from "./share-image-template"

const WIDTH = 1200
const HEIGHT = 630

type RendererOptions = {
  config: ShareImagesConfig
  root: string
  clientDir: string
  base: string
  deploymentBase: string
  siteUrl: string
  siteTitle: string
  titles?: ReadonlyMap<string, string>
}

/** One renderer per build; no network access or system-font discovery. */
export function createShareImageRenderer(
  options: RendererOptions
): NonNullable<ArdoRenderOptions["shareImage"]> {
  const logoCache = new Map<string, Promise<string | undefined>>()
  let fonts: Promise<string[]> | undefined
  return async (page) => {
    if (
      page.routeId == null ||
      !/\.(?:md|mdx)$/u.test(page.routeId) ||
      page.frontmatter?.ogImage != null
    )
      return
    const title = shareImageTitle({
      title: page.frontmatter?.title,
      file: page.routeId,
      fallback: options.titles?.get(page.routeId),
    })
    const logoUrl = page.appearance.logo
    if (logoUrl != null && !logoCache.has(logoUrl))
      logoCache.set(logoUrl, embeddedLogo(logoUrl, options))
    const svg = await (options.config.render ?? defaultShareImage)({
      width: WIDTH,
      height: HEIGHT,
      title,
      siteTitle: options.siteTitle,
      section: page.section,
      locale: page.locale,
      path: page.publicPath,
      fontFamily: options.config.fontFamily,
      logo: logoUrl == null ? undefined : await logoCache.get(logoUrl),
      themeCss: page.appearance.themeCss,
      colors: shareImageColors(page.appearance.themeCss, options.config.render != null),
    })
    // Keep custom templates self-contained too: resvg must never read arbitrary image paths.
    assertSelfContained(svg)
    fonts ??= Promise.all(
      options.config.fonts.map(async (file) => realpath(path.resolve(options.root, file)))
    )
    const png = renderPng(svg, await fonts, {
      family: options.config.fontFamily,
      locale: page.locale,
    })
    const image = await emitShareImage(png, options)
    return withShareImageMeta(page.meta, {
      image,
      title,
      preserveTwitter: typeof page.frontmatter?.twitterImage === "string",
      preserveTwitterCard: typeof page.frontmatter?.twitterCard === "string",
    })
  }
}

function absoluteUrl(value: string, siteUrl: string): string {
  return siteUrl === "" ? value : new URL(value, siteUrl).href
}

function withShareImageMeta(
  meta: ArdoMetaDescriptor[],
  {
    image,
    title,
    preserveTwitter,
    preserveTwitterCard,
  }: { image: string; title: string; preserveTwitter: boolean; preserveTwitterCard: boolean }
): ArdoMetaDescriptor[] {
  const replaces = new Set([
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "og:image:type",
  ])
  const entries = meta.filter(
    (entry) =>
      !("property" in entry && replaces.has(entry.property ?? "")) &&
      !(
        "name" in entry &&
        ((!preserveTwitterCard && entry.name === "twitter:card") ||
          (!preserveTwitter &&
            (entry.name === "twitter:image" || entry.name === "twitter:image:alt")))
      )
  )
  entries.push(
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(WIDTH) },
    { property: "og:image:height", content: String(HEIGHT) },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:alt", content: title }
  )
  if (!preserveTwitterCard) entries.push({ name: "twitter:card", content: "summary_large_image" })
  if (!preserveTwitter)
    entries.push(
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: title }
    )
  return entries.map((entry) => {
    if (!("script:ld+json" in entry)) return entry
    const data = entry["script:ld+json"]
    return typeof data === "object" && data !== null && data["@type"] === "TechArticle"
      ? { "script:ld+json": { ...data, image } }
      : entry
  })
}

async function embeddedLogo(url: string, options: RendererOptions): Promise<string | undefined> {
  if (url.startsWith("data:image/")) return url
  // Remote logos and inline React marks stay the site's responsibility; builds never download them.
  if (!url.startsWith("/") || url.startsWith("//")) return
  if (!url.startsWith(options.deploymentBase)) return
  const file = path.resolve(
    options.clientDir,
    decodeURIComponent(url.slice(options.deploymentBase.length)).split(/[?#]/u)[0]
  )
  if (!file.startsWith(`${path.resolve(options.clientDir)}${path.sep}`))
    throw new Error("[ardo] Share image logo must be a built local asset.")
  const extension = path.extname(file).toLowerCase()
  const mime = new Map([
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
  ]).get(extension)
  if (mime == null)
    throw new Error("[ardo] Share image logo must be an SVG, PNG, JPEG or WebP file.")
  const contents = await readFile(file)
  if (mime === "image/svg+xml") assertSelfContained(contents.toString("utf8"))
  return `data:${mime};base64,${contents.toString("base64")}`
}

function assertSelfContained(svg: string): void {
  if (typeof svg !== "string" || /<!DOCTYPE|@import/iu.test(svg))
    throw new Error("[ardo] Share image templates must be self-contained SVG.")
  const resources = [
    ...[...svg.matchAll(/(?:href)\s*=\s*(["'])(.*?)\1/giu)].map((match) => match[2]),
    ...[...svg.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^'"()]*?))\s*\)/giu)].map(
      (match) => match[2] ?? match[3]
    ),
  ]
  if (
    resources.some(
      (resource) =>
        !resource
          .trim()
          .replaceAll(/&(?:quot|apos);/gu, "")
          .startsWith("data:") &&
        !resource
          .trim()
          .replaceAll(/&(?:quot|apos);/gu, "")
          .startsWith("#")
    )
  ) {
    throw new Error("[ardo] Share image templates must be self-contained SVG with embedded images.")
  }
}

function renderPng(
  svg: string,
  fonts: string[],
  { family, locale }: { family: string; locale: string }
): Buffer {
  const renderer = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
      fontFiles: fonts,
      defaultFontFamily: family.split(",")[0].trim().replaceAll(/["']/gu, ""),
    },
    languages: [locale],
  })
  if (renderer.width !== WIDTH || renderer.height !== HEIGHT)
    throw new Error("[ardo] Share image SVG must be 1200 × 630 pixels.")
  if (renderer.imagesToResolve().length > 0)
    throw new Error("[ardo] Share image SVG contains unresolved image resources.")
  return renderer.render().asPng()
}

async function emitShareImage(png: Buffer, options: RendererOptions): Promise<string> {
  const hash = createHash("sha256").update(png).digest("hex").slice(0, 20)
  const fileName = `assets/share/${hash}.png`
  const output = path.join(
    options.clientDir,
    options.base.slice(options.deploymentBase.length),
    fileName
  )
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, png)
  return absoluteUrl(`${options.base}${fileName}`, options.siteUrl)
}
