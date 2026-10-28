import { readFile } from "node:fs/promises"
import type { Plugin } from "vite"
import type { palamedes } from "@palamedes/vite-plugin"

const prefix = "\0docs:palamedes-mdx:"
const sourceFilename = (id: string) =>
  id.startsWith(prefix) ? id.slice(prefix.length).split("?", 1)[0].slice(0, -4) : id

/** Give explicit MDX imports to Palamedes' full compiler and catalog-delivery pipeline. */
export function palamedesMdxExamples(plugins: ReturnType<typeof palamedes>): Plugin[] {
  const hostPlugins: Plugin[] = plugins
  const source: Plugin = {
    name: "docs:palamedes-mdx-examples",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source.startsWith(prefix)) return source
      if (importer?.startsWith(prefix) === true && source.startsWith(".")) {
        return this.resolve(source, sourceFilename(importer), { skipSelf: true })
      }
      if (!source.endsWith("?palamedes")) return
      const resolved = await this.resolve(source.slice(0, -"?palamedes".length), importer, {
        skipSelf: true,
      })
      if (resolved == null) throw new Error(`Cannot resolve MDX example: ${source}`)
      return `${prefix}${resolved.id}.tsx`
    },
    async load(id) {
      if (!id.startsWith(prefix)) return
      const filename = sourceFilename(id)
      this.addWatchFile(filename)
      return readFile(filename, "utf8")
    },
  }
  return [
    source,
    ...hostPlugins.map((plugin): Plugin => {
      const transform = plugin.transform
      if (transform == null) return plugin
      const handler = typeof transform === "function" ? transform : transform.handler
      return {
        ...plugin,
        // The virtual TSX ID keeps Ardo's route compiler away. Palamedes sees the
        // real MDX filename for extraction, diagnostics, maps, and catalog fragments.
        // Delegate filtering to the handler after remapping that filename.
        transform: {
          ...(typeof transform === "function" ? {} : { order: transform.order }),
          handler(code, id, options) {
            return handler.call(this, code, sourceFilename(id), options)
          },
        },
      }
    }),
  ]
}
