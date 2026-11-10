import fs from "node:fs"
import path from "node:path"
import type { Plugin, Rolldown } from "vite"
import type { ImageAsset } from "./image-pipeline"

export type ImageSession = { assets: Map<string, ImageAsset>; dependencies: Set<string> }
export function createImageSession(): ImageSession {
  return { assets: new Map(), dependencies: new Set() }
}
export function createImagesPlugin(
  session: ImageSession,
  deploymentBase?: () => string | undefined
): Plugin {
  let publicDir = ""
  let copyPublicDir = false
  let projectRoot = ""
  return {
    configResolved(config) {
      projectRoot = config.root
      publicDir = config.publicDir
      copyPublicDir = config.build.copyPublicDir
    },
    name: "ardo:images",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        if (this.environment.name !== "client") return
        assertOriginalAssets(bundle, session.assets)
        for (const asset of session.assets.values()) {
          if (Object.values(bundle).some((item) => item.fileName === asset.fileName)) continue
          const publicFile = publicDir === "" ? undefined : path.join(publicDir, asset.fileName)
          if (publicFile != null && fs.existsSync(publicFile)) {
            assertOriginalFile(publicFile, asset)
            if (copyPublicDir) continue
          }
          this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
        }
      },
    },
    writeBundle: {
      order: "post",
      handler(options, bundle) {
        if (this.environment.name !== "client") return
        // Later post hooks can emit too. Inspect filenames, then the actual written bytes:
        // Rolldown's bundle object can hide duplicate explicit filenames behind one key.
        assertOriginalAssets(bundle, session.assets)
        const directory = path.resolve(projectRoot, options.dir ?? path.dirname(options.file ?? ""))
        for (const asset of session.assets.values())
          assertOriginalFile(path.join(directory, asset.fileName), asset)
      },
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?", 1)[0]
        const base = deploymentBase?.() ?? server.config.base
        if (pathname == null || !pathname.startsWith(base)) return next()
        const asset = session.assets.get(pathname.slice(base.length))
        if (asset == null) return next()
        const extension = asset.fileName.split(".").at(-1)
        const type =
          extension === "jpg" || extension === "jpeg"
            ? "jpeg"
            : extension === "svg"
              ? "svg+xml"
              : extension
        response.setHeader("Content-Type", `image/${type}`)
        response.end(asset.source)
      })
    },
  }
}

function assertOriginalAssets(
  bundle: Rolldown.OutputBundle,
  assets: Map<string, ImageAsset>
): void {
  for (const output of Object.values(bundle)) {
    const expected = assets.get(output.fileName)
    if (
      expected != null &&
      (output.type !== "asset" || !Buffer.from(output.source).equals(expected.source))
    )
      throw new Error("[ardo] An image output collides with another build asset.")
  }
}
function assertOriginalFile(file: string, expected: ImageAsset): void {
  if (!fs.statSync(file).isFile() || !fs.readFileSync(file).equals(expected.source))
    throw new Error("[ardo] An image output collides with another output or public file.")
}
