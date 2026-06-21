import type { ServerResponse } from "node:http"
import type { Plugin, ResolvedConfig as ViteResolvedConfig } from "vite"

import { Resvg } from "@resvg/resvg-js"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { ARDO_FAVICON_SVG } from "../ui/favicon"

const ICON_FILES = new Set(["favicon.ico", "icon.svg", "apple-touch-icon.png"])

export type ArdoIconOptions =
  | {
      /**
       * Source SVG file path, resolved from the Vite root.
       * Inline SVG strings are also accepted.
       */
      source?: string
    }
  | false

export type GeneratedIconAsset = {
  fileName: string
  contentType: string
  source: string | Uint8Array
}

export function createIconsPlugin(options: ArdoIconOptions | undefined): Plugin[] {
  if (options === false) {
    return []
  }

  let config: ViteResolvedConfig
  let assetsPromise: Promise<GeneratedIconAsset[]> | undefined

  const getAssets = async () => {
    assetsPromise ??= createIconAssets(config.root, options)
    return assetsPromise
  }

  const plugin: Plugin = {
    name: "ardo:icons",
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void serveIconRequest({ config, getAssets, response, url: request.url })
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
  getAssets: () => Promise<GeneratedIconAsset[]>
  response: ServerResponse
  url: string | undefined
}): Promise<boolean> {
  const { config, getAssets, response, url } = input
  const fileName = getIconRequestFileName(url)
  if (fileName == null || hasPublicAsset(config, fileName)) {
    return false
  }

  const assets = await getAssets()
  const asset = assets.find((candidate) => candidate.fileName === fileName)
  if (asset == null) {
    return false
  }

  response.statusCode = 200
  response.setHeader("Content-Type", asset.contentType)
  response.setHeader("Cache-Control", "no-cache")
  response.end(asset.source)
  return true
}

export async function createIconAssets(
  root: string,
  options: Exclude<ArdoIconOptions, false> | undefined
): Promise<GeneratedIconAsset[]> {
  const svg = await resolveIconSvg(root, options?.source)
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

async function resolveIconSvg(root: string, source: string | undefined): Promise<string> {
  if (source == null) {
    return ARDO_FAVICON_SVG
  }

  const trimmedSource = source.trim()
  if (trimmedSource.startsWith("<svg")) {
    return trimmedSource
  }

  return readFile(path.resolve(root, source), "utf8")
}

function renderPng(svg: string, size: number): Uint8Array {
  return new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: size,
    },
  })
    .render()
    .asPng()
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

function getIconRequestFileName(url: string | undefined): string | undefined {
  if (url == null) {
    return undefined
  }

  const [pathname] = url.split("?", 1)
  const fileName = pathname.startsWith("/") ? pathname.slice(1) : pathname
  return ICON_FILES.has(fileName) ? fileName : undefined
}

function hasPublicAsset(config: ViteResolvedConfig, fileName: string): boolean {
  return existsSync(path.join(config.publicDir, fileName))
}
