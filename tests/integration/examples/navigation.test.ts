import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { assertDevSSR, assertPreviewSSR } from "./dev-server"
import { createNavigationProject } from "./navigation-project"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true })
})

describe("public CLI document identity and dotted navigation", () => {
  it.each([false, true])(
    "keeps Dev and Preview consistent with locales=%s",
    async (localized) => {
      const directory = createNavigationProject(localized)
      directories.push(directory)
      execFileSync("pnpm", ["--config.verifyDepsBeforeRun=false", "exec", "ardo", "build"], {
        cwd: directory,
        stdio: "pipe",
        timeout: 120_000,
      })
      const base = localized ? "/project/v6/" : "/project/"
      const locales = localized ? ["en", "de"] : [""]
      const pages = locales.flatMap((locale) => {
        const prefix = locale === "" ? "" : `${locale}/`
        const identity = [
          `<html lang="${locale || "de"}">`,
          'href="/project/icon.svg"',
          'href="/project/favicon.ico"',
          'href="/project/apple-touch-icon.png"',
        ]
        const home = `${base}${prefix}`
        const result = [
          {
            pathname: home,
            contains: [
              ...identity,
              `href="${home}guide/release-6.0/"`,
              `href="${home}guide/caf%C3%A9-6.0/"`,
            ],
          },
        ]
        for (const [name, title] of [
          ["release-6.0", "Release 6.0"],
          ["caf%C3%A9-6.0", "Unicode release"],
          ["index.html", "Literal index route"],
        ]) {
          for (const slash of ["", "/"])
            result.push({
              pathname: `${home}guide/${name}${slash}`,
              contains: [...identity, title],
            })
        }
        return result
      })
      pages.push(
        { pathname: "/project/icon.svg", contains: ["Navigation icon override"] },
        { pathname: "/project/favicon.ico", contains: [] },
        { pathname: "/project/apple-touch-icon.png", contains: [] }
      )
      const expected = { pathname: pages[0].pathname, pages }
      await assertDevSSR(directory, expected)
      await assertPreviewSSR(directory, {
        ...expected,
        pages: localized
          ? [...pages, { pathname: base, contains: ["url=/project/v6/en/"] }]
          : pages,
      })
      const output = path.join(directory, "build/client", localized ? "v6/en" : "")
      expect(fs.readFileSync(path.join(output, "guide/index.html/index.html"), "utf8")).toContain(
        "Literal index route"
      )
      const llms = fs.readFileSync(path.join(directory, "build/client/llms-full.txt"), "utf8")
      expect(llms).toContain(`guide/release-6.0/>`)
    },
    180_000
  )
})
