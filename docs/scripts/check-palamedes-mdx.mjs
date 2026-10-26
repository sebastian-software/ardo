import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { analyzeMdxNative } from "@palamedes/core-node"
import { transformWithOxc } from "vite"

const options = {
  framework: "react",
  frontMatterFields: ["title", "description"],
  translatableAttributes: ["alt", "title", "aria-label"],
}

async function check(source, filename) {
  const result = analyzeMdxNative(source, filename, options)
  assert.deepEqual(result.diagnostics, [], `Native MDX diagnostics in ${filename}`)
  assert.ok(result.code, `Missing native MDX output for ${filename}`)
  await transformWithOxc(result.code, filename, { lang: "jsx", jsx: { runtime: "automatic" } })
  return result
}

// This failed in the published 1.x native parser: the import belongs to the fence.
const code = 'import { defineArdoConfig } from "ardo/config"\n'
const fixture = await check(
  "---\ntitle: Fence regression\ndescription: Native MDX extraction\n---\n\n## Read the **guide**\n\n```ts\n" +
    code +
    "```\n",
  "fence-regression.mdx"
)
assert.ok(fixture.code.includes(JSON.stringify(code)), "The fenced import must stay code")
assert.deepEqual(
  fixture.messages.map(({ message }) => message),
  ["Fence regression", "Native MDX extraction", "Read the <0>guide</0>"]
)

const root = new URL("../app/routes/en/guide/", import.meta.url)
const files = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".mdx"))
assert.ok(files.length > 0, "Expected authored English MDX guides")
let messages = 0
for (const file of files) {
  const filename = new URL(file, root)
  const result = await check(await readFile(filename, "utf8"), fileURLToPath(filename))
  messages += result.messages.length
}
console.log(
  `Native Palamedes MDX: ${files.length} guides, ${messages} translation units, no diagnostics.`
)
