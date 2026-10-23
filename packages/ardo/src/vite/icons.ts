import type { ServerResponse } from "node:http"
import type { Plugin, ResolvedConfig as ViteResolvedConfig } from "vite"

import { Resvg } from "@resvg/resvg-js"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { ARDO_FAVICON_SVG } from "../ui/favicon"

const ICON_FILES = new Map([
  ["favicon.ico", "image/x-icon"],
  ["icon.svg", "image/svg+xml"],
  ["apple-touch-icon.png", "image/png"],
])

/**
 * `false` skips the generated owl icons. A site icon comes from `ArdoRoot`'s
 * `icon` and `appleTouchIcon` props, as imported assets.
 */
export type ArdoIconOptions = false

export type GeneratedIconAsset = {
  fileName: string
  contentType: string
  source: string | Uint8Array
}

export function createIconsPlugin(
  options: ArdoIconOptions | undefined,
  deployment: { deploymentBase?: string } = {}
): Plugin[] {
  if (options === false) {
    return []
  }

  let config: ViteResolvedConfig
  let assetsPromise: Promise<GeneratedIconAsset[]> | undefined

  const getAssets = async () => {
    assetsPromise ??= createIconAssets()
    return assetsPromise
  }

  const plugin: Plugin = {
    name: "ardo:icons",
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void serveIconRequest({
          config,
          deploymentBase: deployment.deploymentBase ?? config.base,
          getAssets,
          response,
          url: request.url,
        })
          .then((served) => {
            if (!served) {
              next()
            }
          })
          .catch((error: unknown) => {
            if (error instanceof Error) {
              next(error)
            } else {
              next(new Error(String(error)))
            }
          })
      })
    },
    async generateBundle() {
      if (config.build.ssr !== false) {
        return
      }

      const assets = await getAssets()
      for (const asset of assets) {
        if (hasPublicAsset(config, asset.fileName)) {
          continue
        }

        this.emitFile({
          type: "asset",
          fileName: asset.fileName,
          source: asset.source,
        })
      }
    },
  }

  return [plugin]
}

async function serveIconRequest(input: {
  config: ViteResolvedConfig
  deploymentBase: string
  getAssets: () => Promise<GeneratedIconAsset[]>
  response: ServerResponse
  url: string | undefined
}): Promise<boolean> {
  const { config, deploymentBase, getAssets, response, url } = input
  const fileName = getIconRequestFileName(url, deploymentBase)
  if (fileName == null) {
    return false
  }

  const asset = hasPublicAsset(config, fileName)
    ? {
        contentType: ICON_FILES.get(fileName) ?? "application/octet-stream",
        source: await readFile(path.join(config.publicDir, fileName)),
      }
    : await getAssets().then((assets) =>
        assets.find((candidate) => candidate.fileName === fileName)
      )
  if (asset == null) {
    return false
  }

  response.statusCode = 200
  response.setHeader("Content-Type", asset.contentType)
  response.setHeader("Cache-Control", "no-cache")
  response.end(asset.source)
  return true
}

/** favicon.ico, icon.svg, and apple-touch-icon.png, rendered from Ardo's owl by default. */
export async function createIconAssets(svg = ARDO_FAVICON_SVG): Promise<GeneratedIconAsset[]> {
  const faviconPng = renderPng(svg, 32)
  const appleTouchIcon = renderPng(svg, 180)

  return [
    {
      fileName: "favicon.ico",
      contentType: "image/x-icon",
      source: createIco(faviconPng, 32),
    },
    {
      fileName: "icon.svg",
      contentType: "image/svg+xml",
      source: svg,
    },
    {
      fileName: "apple-touch-icon.png",
      contentType: "image/png",
      source: appleTouchIcon,
    },
  ]
}

function renderPng(svg: string, size: number): Uint8Array {
  return new Resvg(svg, {
    // Scanning the system fonts costs far more than rendering an icon.
    font: { loadSystemFonts: hasText(svg) },
    fitTo: {
      mode: "width",
      value: size,
    },
  })
    .render()
    .asPng()
}

function hasText(svg: string): boolean {
  return /<text[\s/>]/iu.test(svg)
}

function createIco(png: Uint8Array, size: number): Uint8Array {
  const headerLength = 6
  const directoryLength = 16
  const imageOffset = headerLength + directoryLength
  const ico = new Uint8Array(imageOffset + png.length)
  const view = new DataView(ico.buffer)

  writeIcoHeader(view)
  writeIcoDirectory({ ico, imageOffset, pngLength: png.length, size, view })
  ico.set(png, imageOffset)

  return ico
}

function writeIcoHeader(view: DataView): void {
  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)
}

function writeIcoDirectory(input: {
  ico: Uint8Array
  imageOffset: number
  pngLength: number
  size: number
  view: DataView
}): void {
  const { ico, imageOffset, pngLength, size, view } = input
  ico[6] = size >= 256 ? 0 : size
  ico[7] = size >= 256 ? 0 : size
  ico[8] = 0
  ico[9] = 0
  view.setUint16(10, 1, true)
  view.setUint16(12, 32, true)
  view.setUint32(14, pngLength, true)
  view.setUint32(18, imageOffset, true)
}

function getIconRequestFileName(url: string | undefined, base: string): string | undefined {
  if (url == null) {
    return undefined
  }

  const [pathname] = url.split("?", 1)
  const fileName = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//u, "")
  return ICON_FILES.has(fileName) ? fileName : undefined
}

function hasPublicAsset(config: ViteResolvedConfig, fileName: string): boolean {
  return existsSync(path.join(config.publicDir, fileName))
}
