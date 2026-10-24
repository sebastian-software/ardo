import type { ArdoServerRenderContext } from "ardo/runtime"
import { createServerI18nScope } from "@palamedes/runtime/server"

import { loadI18n, resolveLocale } from "./i18n/runtime"

const scope = createServerI18nScope()

/** Scope catalog access to this render, including metadata and suspended MDX components. */
export async function withRenderContext({ path, render }: ArdoServerRenderContext) {
  const i18n = await loadI18n(resolveLocale(path.split("/")[1]))
  return scope.run(i18n, render)
}
