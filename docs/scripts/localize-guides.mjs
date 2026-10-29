import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFile, readdir, mkdir, writeFile, rm, stat, utimes } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { analyzeMdxNative, compileCatalogModule } from "@palamedes/core-node"
import { createI18n } from "@palamedes/core"
import { createCompiledMessageRuntime } from "@palamedes/core/internal"
import { prepareDocument } from "ferromark"
import { parseSync } from "oxc-parser"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

export const locales = ["en", "de", "fr", "es"]
export const mdxOptions = {
  framework: "react",
  frontMatterFields: ["title", "description"],
  translatableAttributes: ["alt", "title", "aria-label", "label", "text", "tagline", "linkText"],
}
const docs = fileURLToPath(new URL("../", import.meta.url))
const sourceDirectory = path.join(docs, "app/content/guide")
const routesDirectory = path.join(docs, "app/routes")

function parse(code, filename = "guide.jsx") {
  const result = parseSync(filename, code, { sourceType: "module" })
  assert.equal(result.errors.length, 0, `Invalid generated JSX in ${filename}`)
  return result.program
}
function walk(node, visit) {
  if (node == null || typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit)
    return
  }
  if (typeof node.type === "string") visit(node)
  for (const [key, value] of Object.entries(node)) if (key !== "parent") walk(value, visit)
}
function name(node) {
  if (node.type === "JSXIdentifier") return node.name
  if (node.type === "JSXMemberExpression") return `${name(node.object)}.${name(node.property)}`
  throw new Error(`Unsupported JSX name: ${node.type}`)
}
function attribute(node, key) {
  return node.openingElement.attributes.find((item) => item.name?.name === key)
}
function value(node) {
  if (node == null) return undefined
  if (node.type === "JSXExpressionContainer") return value(node.expression)
  if (node.type === "Literal" || node.type.endsWith("Literal")) return node.value
  throw new Error(`Expected a literal, received ${node.type}`)
}
function text(source) {
  return String(source)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[{}]/g, (character) => (character === "{" ? "&#123;" : "&#125;"))
    .replace(/[\\`*_\[\]]/g, "\\$&")
}
function fence(code, info = "") {
  const ticks = "`".repeat(
    Math.max(3, ...[...code.matchAll(/`+/g)].map((match) => match[0].length + 1))
  )
  return `\n\n${ticks}${info}\n${code}${code.endsWith("\n") ? "" : "\n"}${ticks}\n\n`
}

/** Lower Palamedes' translated JSX into generated MDX, without executing authored JavaScript. */
export function localizeGuide(source, { filename, destination, locale, i18n }) {
  const native = analyzeMdxNative(source, filename, mdxOptions)
  assert.deepEqual(native.diagnostics, [], `Native MDX diagnostics in ${filename}`)
  assert.ok(native.code, `Missing native MDX output for ${filename}`)
  const code = native.code
  const program = parse(code)
  const prepared = prepareDocument(source, {
    format: "mdx",
    frontMatter: true,
    headingAttributes: true,
    taskLists: true,
    autolinkLiterals: true,
  })
  const frontmatter = parseYaml(prepared.metadata.frontMatter ?? "") ?? {}
  // Historical unlocalized aliases belong to the default English document once.
  if (locale !== "en") delete frontmatter.redirectFrom
  const headingIds = prepared.metadata.outline.map((heading) => heading.id)
  const blocks = prepared.metadata.codeBlocks
  // Ferromark retains alert variants that Palamedes deliberately excludes from messages.
  const structure = parse(
    `const document = <>${prepared.render({ calloutComponents: { note: "Note", tip: "Tip", important: "Info", warning: "Warning", caution: "Danger" } }).body}</>`
  )
  const quotes = []
  walk(structure, (node) => {
    if (
      node.type === "JSXElement" &&
      (name(node.openingElement.name) === "blockquote" ||
        (["Note", "Tip", "Info", "Warning", "Danger"].includes(name(node.openingElement.name)) &&
          attribute(node, "kind")))
    )
      quotes.push(name(node.openingElement.name))
  })
  const listItems = []
  walk(structure, (node) => {
    if (node.type !== "JSXElement" || name(node.openingElement.name) !== "li") return
    const checkbox = node.children.find(
      (child) => child.type === "JSXElement" && name(child.openingElement.name) === "input"
    )
    listItems.push(checkbox ? Boolean(value(attribute(checkbox, "checked")?.value)) : null)
  })
  let headingIndex = 0,
    blockIndex = 0,
    quoteIndex = 0,
    listItemIndex = 0
  const localizeLink = (url) =>
    typeof url === "string" && url.startsWith("/en/") ? `/${locale}/${url.slice(4)}` : url
  function rewrite(node) {
    const edits = []
    walk(node, (child) => {
      if (
        child.type === "CallExpression" &&
        child.callee.type === "MemberExpression" &&
        child.callee.property.name === "_" &&
        child.callee.object.type === "CallExpression" &&
        child.callee.object.callee.name === "__palamedesGetI18n"
      ) {
        edits.push({
          start: child.start,
          end: child.end,
          replacement: JSON.stringify(i18n._(value(child.arguments[0]))),
        })
      } else if (
        child.type === "Literal" &&
        typeof child.value === "string" &&
        child.value.startsWith("/en/")
      ) {
        edits.push({
          start: child.start,
          end: child.end,
          replacement: JSON.stringify(localizeLink(child.value)),
        })
      }
    })
    let result = code.slice(node.start, node.end)
    let previous = node.end
    for (const edit of edits.sort(
      (left, right) => right.start - left.start || left.end - right.end
    )) {
      if (edit.end > previous) continue
      result =
        result.slice(0, edit.start - node.start) +
        edit.replacement +
        result.slice(edit.end - node.start)
      previous = edit.start
    }
    return result
  }
  function renderChildren(nodes) {
    return nodes.map(render).join("")
  }
  function render(node) {
    if (node.type === "ParenthesizedExpression") return render(node.expression)
    if (node.type === "JSXText") return node.value.trim() === "" ? "" : text(node.value)
    if (node.type === "JSXFragment") return renderChildren(node.children)
    if (node.type === "JSXExpressionContainer") {
      if (node.expression.type === "Literal" && typeof node.expression.value === "string")
        return text(node.expression.value)
      return `{${rewrite(node.expression)}}`
    }
    if (node.type !== "JSXElement") throw new Error(`Unsupported MDX output: ${node.type}`)
    const tag = name(node.openingElement.name)
    if (tag === "__PalamedesTrans") {
      const id = value(attribute(node, "id").value)
      const components = attribute(node, "components")?.value.expression.properties ?? []
      const values = attribute(node, "values")?.value.expression.properties ?? []
      const bindings = Object.fromEntries(
        values.map((property) => [
          property.key.name ?? property.key.value,
          `{${rewrite(property.value)}}`,
        ])
      )
      // Distinguish generated markup from literal catalog text so escaping happens once.
      const markup = (output) => ({ toString: () => output })
      const runtime = createCompiledMessageRuntime(locale, {
        join: (...parts) =>
          markup(
            parts.map((part) => (typeof part === "string" ? text(part) : String(part))).join("")
          ),
        literal: (item) => markup(text(item)),
        value: (item) => markup(item),
        number: () => {
          throw new Error("Dynamic numbers belong in an imported React component")
        },
        date: () => {
          throw new Error("Dynamic dates belong in an imported React component")
        },
        time: () => {
          throw new Error("Dynamic times belong in an imported React component")
        },
        pound: () => {
          throw new Error("Dynamic plurals belong in an imported React component")
        },
        tag: (key, children) => {
          const component = components.find(
            (property) => String(property.key.name ?? property.key.value) === key
          )?.value
          assert.ok(component, `Missing rich-text component ${key} in ${filename}`)
          return markup(renderElement(component, String(children)))
        },
      })
      return String(i18n.renderMessage(id, bindings, runtime))
    }
    return renderElement(node)
  }
  function renderElement(node, translatedChildren) {
    const tag = name(node.openingElement.name)
    const children = () => translatedChildren ?? renderChildren(node.children)
    if (tag === "pre") {
      const block = blocks[blockIndex++]
      assert.ok(block, `Missing fenced-code metadata in ${filename}`)
      return fence(block.code, [block.language, block.meta].filter(Boolean).join(" "))
    }
    if (/^h[1-6]$/.test(tag)) {
      const id = headingIds[headingIndex++]
      assert.ok(id, `Missing heading identity in ${filename}`)
      const anchor = locale === "en" ? "" : ` {#${id}}`
      return `\n\n${"#".repeat(Number(tag[1]))} ${children()}${anchor}\n\n`
    }
    if (tag === "p") return `\n\n${children()}\n\n`
    if (tag === "strong") return `**${children()}**`
    if (tag === "em") return `*${children()}*`
    if (tag === "del") return `~~${children()}~~`
    if (tag === "code") {
      const raw =
        node.children.length > 0
          ? node.children
              .map((child) =>
                child.type === "JSXExpressionContainer" ? value(child) : child.value
              )
              .join("")
          : (translatedChildren ?? "").replace(/\\([\\`*_\[\]])/g, "$1")
      const ticks = "`".repeat(
        Math.max(1, ...[...raw.matchAll(/`+/g)].map((match) => match[0].length + 1))
      )
      const padding = raw.startsWith("`") || raw.endsWith("`") ? " " : ""
      return `${ticks}${padding}${raw}${padding}${ticks}`
    }
    if (tag === "a" && attribute(node, "href")) {
      const label =
        translatedChildren === "" && node.children.length > 0
          ? renderChildren(node.children)
          : children()
      return `[${label}](${localizeLink(value(attribute(node, "href").value))})`
    }
    if (tag === "li") return children().trim()
    if (tag === "hr") return "\n\n---\n\n"
    if (tag === "br") return "<br />"
    if (tag === "blockquote") {
      const variant = quotes[quoteIndex++]
      assert.ok(variant, `Missing quote structure in ${filename}`)
      const body = children().trim()
      const marker = {
        Note: "NOTE",
        Tip: "TIP",
        Info: "IMPORTANT",
        Warning: "WARNING",
        Danger: "CAUTION",
      }[variant]
      const prefix = marker ? `> [!${marker}]\n` : ""
      return `\n\n${prefix}${body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}\n\n`
    }
    if (tag === "ul" || tag === "ol") {
      let index = attribute(node, "start") ? Number(value(attribute(node, "start").value)) : 1
      return (
        "\n\n" +
        node.children
          .filter((child) => child.type === "JSXElement")
          .map((child) => {
            const checked = listItems[listItemIndex++]
            const body = renderChildren(child.children).trim()
            const marker = tag === "ul" ? "- " : `${index++}. `
            const task = checked === null ? "" : checked ? "[x] " : "[ ] "
            return (
              marker +
              task +
              body
                .split("\n")
                .map((line, lineIndex) => (lineIndex ? " ".repeat(marker.length) + line : line))
                .join("\n")
            )
          })
          .join("\n") +
        "\n\n"
      )
    }
    if (tag === "table") {
      const rows = []
      walk(node.children, (child) => {
        if (child.type === "JSXElement" && name(child.openingElement.name) === "tr")
          rows.push(child)
      })
      const lines = rows.map(
        (row) =>
          "| " +
          row.children
            .filter((child) => child.type === "JSXElement")
            .map((cell) =>
              renderChildren(cell.children).trim().replace(/\|/g, "\\|").replace(/\n/g, " ")
            )
            .join(" | ") +
          " |"
      )
      const columns = rows[0].children.filter((child) => child.type === "JSXElement").length
      lines.splice(1, 0, "| " + Array(columns).fill("---").join(" | ") + " |")
      return `\n\n${lines.join("\n")}\n\n`
    }
    const attributes = node.openingElement.attributes.map((item) => rewrite(item)).join(" ")
    const opening = `<${tag}${attributes ? ` ${attributes}` : ""}`
    if (node.openingElement.selfClosing && translatedChildren === undefined)
      return ["CodeBlock", "GalleryIcons", "Welcome", "SetupPrompt", "Hero"].includes(tag)
        ? `\n\n${opening} />\n\n`
        : `${opening} />`
    const body = children()
    const block =
      body.includes("\n") ||
      [
        "Tip",
        "Note",
        "Info",
        "Warning",
        "Danger",
        "Card",
        "CardGroup",
        "Tabs",
        "TabList",
        "TabPanels",
        "TabPanel",
        "Steps",
        "CodeGroup",
        "GalleryPreview",
      ].includes(tag)
    return block
      ? `\n\n${opening}>\n\n${body.trim()}\n\n</${tag}>\n\n`
      : `${opening}>${body}</${tag}>`
  }
  const frontmatterFunction = program.body.find(
    (statement) => statement.declaration?.id?.name === "getTranslatedFrontmatter"
  )?.declaration
  if (frontmatterFunction) {
    const object = frontmatterFunction.body.body.find(
      (statement) => statement.type === "ReturnStatement"
    ).argument
    for (const property of object.properties) {
      if (property.type === "SpreadElement") continue
      frontmatter[value(property.key)] = i18n._(value(property.value.arguments[0]))
    }
  }
  const content = program.body.find(
    (statement) => statement.type === "FunctionDeclaration" && statement.id.name === "MDXContent"
  )
  const body = render(
    content.body.body.find((statement) => statement.type === "ReturnStatement").argument
  )
  assert.equal(headingIndex, headingIds.length, `Heading count changed in ${filename}`)
  assert.equal(blockIndex, blocks.length, `Fence count changed in ${filename}`)
  assert.equal(quoteIndex, quotes.length, `Quote count changed in ${filename}`)
  assert.equal(listItemIndex, listItems.length, `List item count changed in ${filename}`)
  const esm = prepared.metadata.esm
    .map(({ value: statement }) => {
      const parsed = parse(statement)
      const edits = []
      walk(parsed, (node) => {
        if (node.type === "ImportDeclaration" && node.source.value.startsWith(".")) {
          let relative = path
            .relative(
              path.dirname(destination),
              path.resolve(path.dirname(filename), node.source.value)
            )
            .split(path.sep)
            .join("/")
          if (!relative.startsWith(".")) relative = `./${relative}`
          edits.push({
            start: node.source.start,
            end: node.source.end,
            value: JSON.stringify(relative),
          })
        }
      })
      for (const edit of edits.sort((left, right) => right.start - left.start))
        statement = statement.slice(0, edit.start) + edit.value + statement.slice(edit.end)
      return statement
    })
    .join("\n\n")
  return `---\n${stringifyYaml(frontmatter).trim()}\n---\n\n{/* Generated from app/content/guide and PO catalogs. Edit the source, not this route. */}\n\n${esm}\n\n${body.trim()}\n`
}

export async function generateGuides() {
  const files = (await readdir(sourceDirectory, { recursive: true }))
    .filter((file) => file.endsWith(".mdx"))
    .sort()
  const config = {
    rootDir: docs,
    locales,
    sourceLocale: "en",
    mdx: mdxOptions,
    catalogs: [{ path: "app/i18n/guides/{locale}", include: ["app/content/guide"] }],
  }
  const output = []
  const timestamps = new Map()
  async function sourceTimestamp(filename) {
    if (timestamps.has(filename)) return timestamps.get(filename)
    const result = spawnSync("git", ["log", "-1", "--format=%ct", "--", filename], {
      cwd: docs,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    const committed = Number(result.stdout?.trim()) * 1000
    const timestamp = committed > 0 ? committed : Math.trunc((await stat(filename)).mtimeMs)
    timestamps.set(filename, timestamp)
    return timestamp
  }
  for (const locale of locales) {
    const catalog = compileCatalogModule(config, path.join(docs, `app/i18n/guides/${locale}.po`), {
      locale,
      failOnMissing: true,
    })
    const moduleCode = catalog.code.replace(
      '"@palamedes/core/compiled"',
      JSON.stringify(import.meta.resolve("@palamedes/core/compiled"))
    )
    const { messages } = await import(
      `data:text/javascript;base64,${Buffer.from(moduleCode).toString("base64")}`
    )
    const i18n = createI18n({ locale, timeZone: "UTC" })
    i18n.load(locale, messages)
    const directory = path.join(routesDirectory, locale, "guide")
    for (const file of files) {
      const filename = path.join(sourceDirectory, file),
        destination = path.join(directory, file)
      const generated = localizeGuide(await readFile(filename, "utf8"), {
        filename,
        destination,
        locale,
        i18n,
      })
      prepareDocument(generated, {
        format: "mdx",
        frontMatter: true,
        headingAttributes: true,
        taskLists: true,
        autolinkLiterals: true,
      })
      const timestamp = Math.max(
        await sourceTimestamp(filename),
        await sourceTimestamp(path.join(docs, `app/i18n/guides/${locale}.po`))
      )
      output.push({ destination, generated, timestamp })
    }
  }
  // Validate all locales before publishing any changed route, including in development.
  const expected = new Set(files)
  for (const locale of locales) {
    const directory = path.join(routesDirectory, locale, "guide")
    await mkdir(directory, { recursive: true })
    for (const stale of await readdir(directory, { recursive: true }))
      if (stale.endsWith(".mdx") && !expected.has(stale)) await rm(path.join(directory, stale))
  }
  for (const { destination, generated, timestamp } of output) {
    let previous
    try {
      previous = await readFile(destination, "utf8")
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
    if (previous !== generated) {
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, generated)
    }
    // Ignored routes have no Git history; retain the latest authored source/catalog date.
    if (Math.trunc((await stat(destination)).mtimeMs) !== timestamp)
      await utimes(destination, timestamp / 1000, timestamp / 1000)
  }
  console.log(
    `Localized ${files.length} MDX sources into ${files.length * locales.length} generated guide routes.`
  )
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await generateGuides()
