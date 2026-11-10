import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import type { Plugin } from "vite"

export const WORKSPACE_STYLE_WATCH_META_KEY = "ardo:workspace-style-watch-files"

/** Preserve which style dependencies Vanilla Extract adds solely for Vite's watcher. */
export function createVanillaExtractPlugins(): Plugin[] {
  return vanillaExtractPlugin({ identifiers: "short" }).map((plugin) => {
    const transform = plugin.transform
    if (transform == null) return plugin
    const handler = typeof transform === "function" ? transform : transform.handler
    const wrapped: typeof handler = async function (code, id, options) {
      const files: string[] = []
      const context = new Proxy(this, {
        get(target, key, receiver) {
          if (key === "addWatchFile")
            return (file: string) => {
              files.push(file)
              target.addWatchFile(file)
            }
          return Reflect.get(target, key, receiver)
        },
      })
      const result = await handler.call(context, code, id, options)
      if (result == null) return result
      const output = typeof result === "string" ? { code: result } : result
      return { ...output, meta: { ...output.meta, [WORKSPACE_STYLE_WATCH_META_KEY]: files } }
    }
    return {
      ...plugin,
      transform: typeof transform === "function" ? wrapped : { ...transform, handler: wrapped },
    }
  })
}

export function workspaceStyleWatchFiles(meta: unknown): string[] {
  if (meta == null || typeof meta !== "object") return []
  const files: unknown = Object.getOwnPropertyDescriptor(
    meta,
    WORKSPACE_STYLE_WATCH_META_KEY
  )?.value
  return Array.isArray(files)
    ? files.filter((file): file is string => typeof file === "string")
    : []
}
