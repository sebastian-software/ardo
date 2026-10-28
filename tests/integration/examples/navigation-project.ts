import fs from "node:fs"
import path from "node:path"

import { createTestProject } from "./project"

/** Exercise the public Basic root against deployment, locale, and dotted-route inputs. */
export function createNavigationProject(localized: boolean): string {
  const directory = fs.realpathSync(createTestProject())
  fs.mkdirSync(path.join(directory, "public"), { recursive: true })
  fs.writeFileSync(
    path.join(directory, "public/icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>Navigation icon override</title><rect width="32" height="32" fill="blue"/></svg>'
  )
  const routes = path.join(directory, "app/routes")
  fs.rmSync(routes, { recursive: true })
  const locales = localized ? ["en", "de"] : [""]
  for (const locale of locales) {
    const prefix = locale === "" ? "" : `/${locale}`
    const folder = path.join(routes, locale)
    fs.mkdirSync(path.join(folder, "guide"), { recursive: true })
    fs.writeFileSync(
      path.join(folder, "home.tsx"),
      `
import { useState } from "ardo/react"
import { ArdoLink } from "ardo/runtime"
export default function Home() {
  const [count, setCount] = useState(0)
  return <><h1>Navigation fixture</h1>
    <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    <ArdoLink to="${prefix}/guide/release-6.0">Dotted release</ArdoLink>
    <ArdoLink to="${prefix}/guide/caf%C3%A9-6.0">Unicode release</ArdoLink>
  </>
}
`
    )
    for (const [name, title] of [
      ["release-6.0", "Release 6.0"],
      ["café-6.0", "Unicode release"],
      ["index.html", "Literal index route"],
    ])
      fs.writeFileSync(
        path.join(folder, "guide", `${name}.mdx`),
        `---
title: ${title}
---

# ${title}

## Details

[Release](release-6.0)
`
      )
  }
  fs.writeFileSync(
    path.join(directory, "ardo.config.ts"),
    `
import { defineArdoConfig } from "ardo/config"
export default defineArdoConfig(${JSON.stringify({
      title: "Navigation fixture",
      siteUrl: "https://docs.example.test",
      base: "/project/",
      lang: localized ? "fr" : "de",
      linkCheck: { level: "error" },
      ...(localized
        ? {
            versioning: {
              current: "v6",
              versions: [{ id: "v6", path: "/v6/" }],
            },
            i18n: {
              defaultLocale: "en",
              redirectUnlocalized: true,
              locales: [{ id: "en" }, { id: "de" }],
            },
          }
        : {}),
    })})
`
  )
  // A custom shell wrapper must inherit the same per-request defaults as the fallback shell.
  fs.appendFileSync(
    path.join(directory, "app/root.tsx"),
    `
import type { ReactNode } from "ardo/react"
import { ArdoRootLayout } from "ardo/ui"
import { getRenderPath } from "./render-state"
export function Layout({ children }: { children: ReactNode }) {
  return <ArdoRootLayout><meta name="render-scope" content={getRenderPath()} />{children}</ArdoRootLayout>
}
`
  )
  fs.writeFileSync(
    path.join(directory, "app/render-state.ts"),
    `
let reader = () => "client"
export function setRenderPathReader(value: () => string) { reader = value }
export function getRenderPath() { return reader() }
`
  )
  fs.writeFileSync(
    path.join(directory, "app/server.ts"),
    `
import { AsyncLocalStorage } from "node:async_hooks"
import type { ArdoServerRenderContext } from "ardo/runtime"
import { setRenderPathReader } from "./render-state"
const scope = new AsyncLocalStorage<string>()
setRenderPathReader(() => scope.getStore() ?? "unscoped")
export function withRenderContext({path, render}: ArdoServerRenderContext) {
  return scope.run(path.replace(/\\/+$/u, ""), async () => {
    await new Promise((resolve) => setTimeout(resolve, path.includes("de") ? 8 : 1))
    return render()
  })
}
`
  )
  return directory
}
