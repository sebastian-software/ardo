import path from "node:path"
import { Readable } from "node:stream"
import type { ArdoServerRenderContext } from "ardo/runtime"
import { createServerI18nScope } from "@palamedes/runtime/server"
import { createViteCatalogDelivery } from "@palamedes/vite-plugin/delivery"

import { loadI18n, locales, resolveLocale } from "./i18n/runtime"

const scope = createServerI18nScope()
const clientDirectory = path.resolve("build/client")
// Assets follow Ardo's resolved base, shared by site pages and documentation.
// Vite's manifest stays at the client root, with asset paths relative to that base.
const assetDirectory = path.join(clientDirectory, import.meta.env.BASE_URL)
const delivery = createViteCatalogDelivery({
  clientDirectory: assetDirectory,
  manifestName: path.relative(
    assetDirectory,
    path.join(clientDirectory, "palamedes-split-manifest.json")
  ),
  development: import.meta.env.DEV,
})

/** Keep one locale across SSR, then deliver its catalog dependencies before client modules. */
export async function withRenderContext({ path: pathname, render }: ArdoServerRenderContext) {
  // The renderer receives /de/news/... for site pages and /v6/de/guide/... for docs.
  const locale = resolveLocale(
    pathname.split("/").find((segment) => locales.some((candidate) => candidate === segment))
  )
  const i18n = await loadI18n(locale)
  const result = await scope.run(i18n, render)
  const document = Readable.from([result.html]).pipe(
    delivery.createDocumentTransform(delivery.getLocaleBinding(locale))
  )
  let html = ""
  for await (const chunk of document) html += String(chunk)
  return { ...result, html }
}
