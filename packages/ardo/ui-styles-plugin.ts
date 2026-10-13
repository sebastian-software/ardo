import { posix } from "node:path"
import type { TsdownPlugin } from "tsdown"

/** Publish one explicit stylesheet instead of replaying CSS from UI chunks. */
export function uiStylesPlugin(): TsdownPlugin {
  return {
    name: "ardo-ui-styles",
    generateBundle(_options, bundle) {
      const assets = Object.values(bundle)
        .filter((entry) => entry.type === "asset")
        .filter((entry) => entry.fileName.endsWith(".css"))
      if (assets.length === 0) return

      const cssFiles = new Set(assets.map((asset) => asset.fileName))
      const stylesEntry = bundle["ui/styles.js"]
      const order = new Map<string, number>()
      if (stylesEntry?.type === "chunk") {
        for (const match of stylesEntry.code.matchAll(/import\s+["']([^"']+\.css)["']/g)) {
          order.set(posix.normalize(posix.join("ui", match[1])), order.size)
        }
      }
      // Preserve the explicit stylesheet's order, then include styles used only
      // by component chunks (for example badges and error boundaries).
      assets.sort(
        (left, right) =>
          (order.get(left.fileName) ?? Infinity) - (order.get(right.fileName) ?? Infinity)
      )
      const stylesheet = assets.map((asset) => asset.source).join("\n")
      this.emitFile({
        type: "asset",
        fileName: "ui/styles.css",
        source: `@layer ardo {\n${stylesheet}\n}\n`,
      })

      for (const entry of Object.values(bundle)) {
        if (entry.type !== "chunk") continue
        entry.code = entry.code.replace(
          /^import\s+["']([^"']+\.css)["'];?[ \t]*$/gm,
          (statement, specifier: string) => {
            const fileName = posix.normalize(posix.join(posix.dirname(entry.fileName), specifier))
            // Keep line and column offsets intact for the existing source map.
            return cssFiles.has(fileName) ? statement.replace(/[^\r\n]/g, " ") : statement
          }
        )
      }
      for (const fileName of cssFiles) delete bundle[fileName]
    },
  }
}
