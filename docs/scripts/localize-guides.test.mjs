import assert from "node:assert/strict"
import { test } from "node:test"
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { analyzeMdxNative, compileCatalogModule } from "@palamedes/core-node"
import { createI18n } from "@palamedes/core"
import { prepareDocument } from "ferromark"
import { generateGuides, localizeGuide, mdxOptions } from "./localize-guides.mjs"

const options = {
  format: "mdx",
  frontMatter: true,
  headingAttributes: true,
  taskLists: true,
  autolinkLiterals: true,
}

test("localized MDX preserves components, rich text, source anchors, callouts, tasks, and exact code", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ardo-guide-catalog-"))
  try {
    const source = `---
title: Guide
description: Before you start
order: 3
redirectFrom: /v6/old-guide
---

import Counter from "../../components/Counter"
export const notExecuted = (() => { throw new Error("Do not execute authored JavaScript") })()

# Guide

## Read **carefully**

Read the **guide** at [start](/en/guide/start) with \`import x from "x"\`.

> [!WARNING]
> Keep the backup.

- [x] Complete
- [ ] Pending

\`\`\`ts title="types.ts"
import { Thing } from "./types"
\`\`\`

<Counter title="Count" />
`
    const translations = {
      Guide: "Anleitung",
      "Before you start": "Bevor du beginnst",
      "Read the <0>guide</0> at <1>start</1> with <2/>.":
        "Lies den <0>Guide</0> unter <1>Start</1> mit <2/>.",
      "Read <0>carefully</0>": "Bitte <0>aufpassen</0>",
      "Keep the backup.": "Behalte die Sicherung.",
      Complete: "Erledigt",
      Pending: "Offen",
      Count: "Zähler",
    }
    const filename = path.join(root, "app/content/guide/demo.mdx")
    const destination = path.join(root, "app/routes/de/guide/demo.mdx")
    await mkdir(path.dirname(filename), { recursive: true })
    await writeFile(filename, source)
    const messages = analyzeMdxNative(source, filename, mdxOptions).messages
    const po = [...new Set(messages.map(({ message }) => message))]
      .map((message) => {
        assert.ok(Object.hasOwn(translations, message), `Unexpected fixture message: ${message}`)
        return `msgid ${JSON.stringify(message)}\nmsgstr ${JSON.stringify(translations[message])}`
      })
      .join("\n\n")
    const resourcePath = path.join(root, "de.po")
    await writeFile(resourcePath, po)
    await writeFile(
      path.join(root, "en.po"),
      [...new Set(messages.map(({ message }) => message))]
        .map((message) => `msgid ${JSON.stringify(message)}\nmsgstr ${JSON.stringify(message)}`)
        .join("\n\n")
    )
    const config = {
      rootDir: root,
      locales: ["en", "de"],
      sourceLocale: "en",
      mdx: mdxOptions,
      catalogs: [{ path: "{locale}", include: ["app/content/guide"] }],
    }
    const catalog = compileCatalogModule(config, resourcePath, {
      locale: "de",
      failOnMissing: true,
    })
    const moduleCode = catalog.code.replace(
      '"@palamedes/core/compiled"',
      JSON.stringify(import.meta.resolve("@palamedes/core/compiled"))
    )
    const i18n = createI18n({ locale: "de" })
    i18n.load(
      "de",
      (await import(`data:text/javascript;base64,${Buffer.from(moduleCode).toString("base64")}`))
        .messages
    )
    const localized = localizeGuide(source, { filename, destination, locale: "de", i18n })
    const prepared = prepareDocument(localized, options)
    assert.match(localized, /title: Anleitung/)
    assert.match(localized, /description: Bevor du beginnst/)
    assert.match(localized, /order: 3/)
    assert.doesNotMatch(localized, /redirectFrom:/)
    assert.match(localized, /## Bitte \*\*aufpassen\*\* \{#read-carefully\}/)
    assert.match(localized, /\[Start\]\(\/de\/guide\/start\)/)
    assert.match(localized, /<Counter title=\{"Zähler"\} \/>/)
    assert.match(localized, /import Counter from "\.\.\/\.\.\/\.\.\/components\/Counter"/)
    assert.match(localized, /Do not execute authored JavaScript/)
    assert.match(localized, /> \[!WARNING\]\n> Behalte die Sicherung\./)
    assert.match(localized, /- \[x\] Erledigt/)
    assert.match(localized, /- \[ \] Offen/)
    assert.match(localized, /`import x from "x"`/)
    assert.deepEqual(
      prepared.metadata.codeBlocks,
      prepareDocument(source, options).metadata.codeBlocks
    )
    assert.deepEqual(
      prepared.metadata.outline.map(({ id }) => id),
      ["guide", "read-carefully"]
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("all generated guide routes retain source code, links, and heading identities", async () => {
  await generateGuides()
  const root = new URL("../app/content/guide/", import.meta.url)
  const files = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".mdx"))
  assert.ok(files.length > 0)
  for (const file of files) {
    const source = prepareDocument(await readFile(new URL(file, root), "utf8"), options)
    for (const locale of ["en", "de", "fr", "es"]) {
      const localized = prepareDocument(
        await readFile(new URL(`../app/routes/${locale}/guide/${file}`, import.meta.url), "utf8"),
        options
      )
      assert.deepEqual(
        localized.metadata.codeBlocks,
        source.metadata.codeBlocks,
        `${locale}/${file}: code fences`
      )
      assert.deepEqual(
        localized.metadata.outline.map(({ id }) => id),
        source.metadata.outline.map(({ id }) => id),
        `${locale}/${file}: heading IDs`
      )
      assert.deepEqual(
        localized
          .collectReferences()
          .map(({ destination }) => destination)
          .sort(),
        source
          .collectReferences()
          .map(({ destination }) => destination.replace(/^\/en\//, `/${locale}/`))
          .sort(),
        `${locale}/${file}: links`
      )
      if (locale === "en") {
        assert.equal(
          localized.extractText().text.replace(/\s+/g, " ").trim(),
          source.extractText().text.replace(/\s+/g, " ").trim(),
          `${file}: English text changed during localization`
        )
      }
    }
  }
})
