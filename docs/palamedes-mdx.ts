import { readFile } from "node:fs/promises"
import { analyzeMdxNative } from "@palamedes/core-node"
import { transformWithOxc, type Plugin } from "vite"

/** Let Palamedes compile explicitly imported examples; Ardo owns route MDX. */
export function palamedesMdxExamples(): Plugin {
  const prefix = "\0docs:palamedes-mdx:"
  return {
    name: "docs:palamedes-mdx-examples",
    enforce: "pre",
    async resolveId(source, importer) {
      if (importer?.startsWith(prefix) === true && source.startsWith(".")) {
        return this.resolve(source, importer.slice(prefix.length, -4), { skipSelf: true })
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
      const filename = id.slice(prefix.length, -4)
      this.addWatchFile(filename)
      const source = await readFile(filename, "utf8")
      const result = analyzeMdxNative(source, filename, { framework: "react" })
      if (result.diagnostics.length > 0 || result.code == null) {
        throw new Error(`Palamedes MDX: ${JSON.stringify(result.diagnostics)}`)
      }
      return transformWithOxc(
        result.code,
        filename,
        { jsx: { runtime: "automatic" }, lang: "jsx" },
        result.map
      )
    },
  }
}
