import { createHash } from "node:crypto"
import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { extname, join, normalize, relative, resolve, sep } from "node:path"

const [
  baselineInput,
  candidateInput,
  fixtureInput,
  receiptInput,
  baselineVerifierInput,
  candidateVerifierInput,
  baselineOriginalVerifierInput,
  candidateOriginalVerifierInput,
] = process.argv.slice(2)
if (!baselineInput || !candidateInput || !fixtureInput) {
  throw new Error(
    "Usage: node compare-ferriki-outputs.mjs BASELINE_CLIENT CANDIDATE_CLIENT FIXTURE [RECEIPT [BASELINE_VERIFIER CANDIDATE_VERIFIER BASELINE_ORIGINAL_VERIFIER CANDIDATE_ORIGINAL_VERIFIER]]"
  )
}

const expectedPages = [
  "index.html",
  "guide/getting-started/index.html",
  "guide/migrating-from-shiki/index.html",
  "guide/languages-and-themes/index.html",
  "guide/class-highlighting/index.html",
  "guide/api/index.html",
  "guide/troubleshooting/index.html",
  "rust/getting-started/index.html",
  "evidence/benchmarks/index.html",
  "evidence/compatibility/index.html",
]
const origin = "https://ferriki.dev"
const expectedFixtureSha256 = "be71440bb815f448cacd039ff2909139f6b2099b7036d82fc321105122a00d04"
const baseline = resolve(baselineInput)
const candidate = resolve(candidateInput)
const fixturePath = resolve(fixtureInput)
const digest = (value) => createHash("sha256").update(value).digest("hex")
const verifierPaths = [
  baselineVerifierInput,
  candidateVerifierInput,
  baselineOriginalVerifierInput,
  candidateOriginalVerifierInput,
]
if (verifierPaths.some(Boolean) && verifierPaths.some((value) => !value)) {
  throw new Error("Supply all four adapted and original verifier paths together.")
}
const verifierDigests = await Promise.all(
  verifierPaths.map(async (value) => (value ? await fileDigest(resolve(value)) : null))
)
if (verifierPaths.some(Boolean) && verifierDigests.some((value) => value === null)) {
  throw new Error("One or more supplied verifier paths could not be read.")
}

const fixture = await readFile(fixturePath, "utf8")
if (digest(fixture) !== expectedFixtureSha256) {
  throw new Error("The Ferriki compatibility fixture differs from the pinned corpus.")
}
const fences = parseFences(fixture)
if (fences.length !== 4) throw new Error("The compatibility fixture must contain four fences.")

const baselineResult = await inspectClient("baseline", baseline, fences, {
  strictNativeMetadata: false,
})
const candidateResult = await inspectClient("candidate", candidate, fences, {
  strictNativeMetadata: true,
})
const linkDifferences = compareLinks(baselineResult.links, candidateResult.links)
const unexplainedBaselineReferences = linkDifferences.baselineOnlyReferences.filter(
  (reference) => !reference.endsWith("\t#main-content")
)
if (
  unexplainedBaselineReferences.length > 0 ||
  linkDifferences.candidateOnlyReferences.length > 0
) {
  throw new Error(
    "Baseline and candidate have unexplained internal link targets. Baseline-only: " +
      unexplainedBaselineReferences.slice(0, 12).join(", ") +
      "; candidate-only: " +
      linkDifferences.candidateOnlyReferences.slice(0, 12).join(", ")
  )
}
for (let index = 0; index < fences.length; index++) {
  if (
    baselineResult.fences[index].normalizedOutputTextSha256 !==
    candidateResult.fences[index].normalizedOutputTextSha256
  ) {
    throw new Error(
      "Baseline and candidate rendered source text differs for " + fences[index].title + "."
    )
  }
}

const fenceReports = fences.map((fence, index) => ({
  title: fence.title,
  language: fence.language,
  label: fence.label,
  highlightLines: fence.highlightLines,
  showLineNumbers: fence.showLineNumbers,
  displayLineCount: fence.displayCode.split(/\r?\n/u).length,
  sourceSha256: digest(fence.code),
  sourceLineNumbers: fence.showLineNumbers
    ? Array.from({ length: fence.displayCode.split(/\r?\n/u).length }, (_, line) => line + 1)
    : [],
  normalizedSourceTextEqual:
    baselineResult.fences[index].normalizedOutputTextSha256 ===
    candidateResult.fences[index].normalizedOutputTextSha256,
  exactRenderedTextEqual:
    baselineResult.fences[index].outputTextSha256 ===
    candidateResult.fences[index].outputTextSha256,
  trailingLineBreaks: {
    baseline: baselineResult.fences[index].trailingLineBreaks,
    candidate: candidateResult.fences[index].trailingLineBreaks,
  },
  lineNumberMetadataEqual:
    baselineResult.fences[index].lineNumberStatus === "present" &&
    JSON.stringify(baselineResult.fences[index].emittedLineNumbers) ===
      JSON.stringify(candidateResult.fences[index].emittedLineNumbers),
  highlightedLineMetadataEqual:
    baselineResult.fences[index].highlightStatus !== "unsupported" &&
    JSON.stringify(baselineResult.fences[index].emittedHighlightedLines) ===
      JSON.stringify(candidateResult.fences[index].emittedHighlightedLines),
  titleMetadataEqual:
    baselineResult.fences[index].visibleTitleMetadata &&
    candidateResult.fences[index].visibleTitleMetadata,
  languageMetadataEqual:
    baselineResult.fences[index].languageMetadata && candidateResult.fences[index].languageMetadata,
  outputMetadataFormatEqual:
    baselineResult.fences[index].outputMetadataFormat ===
    candidateResult.fences[index].outputMetadataFormat,
  baseline: baselineResult.fences[index],
  candidate: candidateResult.fences[index],
}))
const baselineFrameworkSkipLinks = linkDifferences.baselineOnlyReferences.filter((reference) =>
  reference.endsWith("\t#main-content")
)
const candidateAdditionalExistingTargetOccurrences = linkDifferences.occurrenceDifferences
  .filter((entry) => entry.candidate > entry.baseline)
  .reduce((sum, entry) => sum + entry.candidate - entry.baseline, 0)
const receipt = {
  schemaVersion: 3,
  sourceFixtureSha256: digest(fixture),
  routes: expectedPages,
  routeCoverage: {
    expectedRouteCount: expectedPages.length,
    expectedRoutesPresentInBoth: true,
    allInternalLinksAndFragmentsResolveInBoth: true,
    baselineInternalLinksAndFragments: baselineResult.links.length,
    candidateInternalLinksAndFragments: candidateResult.links.length,
    exactLinkOccurrenceParity: linkDifferences.exactOccurrenceParity,
    exactLinkTargetParity: linkDifferences.exactTargetParity,
    baselineOnlyTargets: linkDifferences.baselineOnlyReferences,
    candidateOnlyTargets: linkDifferences.candidateOnlyReferences,
    occurrenceDifferences: linkDifferences.occurrenceDifferences,
    baselineFrameworkSkipLinks,
    candidateAdditionalExistingTargetOccurrences,
    explainedFrameworkChromeDelta:
      "Baseline-only #main-content skip links come from the legacy framework chrome; Ferriki uses handle.chrome:false and provides its own skip link.",
    explainedOccurrenceDelta:
      "Additional candidate occurrences point to existing internal targets; exact per-target counts are listed above, and the candidate adds no new target.",
  },
  metadataCapabilities: {
    baseline: baselineResult.fences.map(
      ({ title, visibleTitleMetadata, languageMetadata, lineNumberStatus, highlightStatus }) => ({
        title,
        visibleTitleMetadata,
        languageMetadata,
        lineNumberStatus,
        highlightStatus,
      })
    ),
    candidate: candidateResult.fences.map(
      ({ title, visibleTitleMetadata, languageMetadata, lineNumberStatus, highlightStatus }) => ({
        title,
        visibleTitleMetadata,
        languageMetadata,
        lineNumberStatus,
        highlightStatus,
      })
    ),
  },
  baseline: {
    compatibilityHtmlSha256: baselineResult.compatibilityHtmlSha256,
    buildVerifierSha256: verifierDigests[0],
    originalBuildVerifierSha256: verifierDigests[2],
  },
  candidate: {
    compatibilityHtmlSha256: candidateResult.compatibilityHtmlSha256,
    buildVerifierSha256: verifierDigests[1],
    originalBuildVerifierSha256: verifierDigests[3],
  },
  fences: fenceReports,
}

if (receiptInput) {
  const receiptPath = resolve(receiptInput)
  await mkdir(resolve(receiptPath, ".."), { recursive: true })
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n")
}
console.log(JSON.stringify(receipt, null, 2))

async function inspectClient(name, directory, expectedFences, { strictNativeMetadata }) {
  const pages = new Map()
  for (const page of expectedPages) {
    const filename = join(directory, page)
    await access(filename).catch(() => {
      throw new Error(name + " is missing expected route " + page + ".")
    })
    pages.set(page, await readFile(filename, "utf8"))
  }

  const idsByPage = new Map()
  for (const [page, html] of pages) {
    const tags = htmlTags(html)
    const h1Count = tags.filter((tag) => tag.name === "h1").length
    if (h1Count !== 1) throw new Error(name + " " + page + " has " + h1Count + " h1 elements.")
    const mainCount = tags.filter(
      (tag) => tag.name === "main" || attribute(tag.raw, "role") === "main"
    ).length
    if (mainCount !== 1)
      throw new Error(name + " " + page + " has " + mainCount + " main landmarks.")
    idsByPage.set(page, new Set(tags.map((tag) => attribute(tag.raw, "id")).filter(Boolean)))
  }

  const links = []
  for (const [page, html] of pages) {
    for (const tag of htmlTags(html)) {
      if (tag.name !== "a") continue
      const rawHref = attribute(tag.raw, "href")
      if (rawHref === undefined) continue
      const href = decodeHtml(rawHref).trim()
      if (href === "") continue
      const sourcePath = page === "index.html" ? "/" : "/" + page.replace(/index\.html$/u, "")
      const targetUrl = new URL(href, new URL(sourcePath, origin))
      if (targetUrl.origin !== origin) continue
      let targetPath = normalize(decodeURIComponent(targetUrl.pathname).replace(/^\/+/u, ""))
      if (targetPath === "" || targetUrl.pathname.endsWith("/") || !extname(targetPath)) {
        targetPath = join(targetPath, "index.html")
      }
      const absolutePath = resolve(directory, targetPath)
      const outside = relative(directory, absolutePath)
      if (outside === ".." || outside.startsWith(".." + sep)) {
        throw new Error(name + " " + page + " links outside the built site: " + href)
      }
      await access(absolutePath).catch(() => {
        throw new Error(name + " " + page + " links to a missing file: " + href)
      })
      const fragment = decodeURIComponent(targetUrl.hash.slice(1))
      if (fragment && targetPath.endsWith(".html")) {
        let targetIds = idsByPage.get(targetPath)
        if (targetIds === undefined) {
          targetIds = new Set(
            htmlTags(await readFile(absolutePath, "utf8"))
              .map((entry) => attribute(entry.raw, "id"))
              .filter(Boolean)
          )
          idsByPage.set(targetPath, targetIds)
        }
        if (!targetIds.has(fragment)) {
          throw new Error(name + " " + page + " links to a missing fragment: " + href)
        }
      }
      links.push(page + "\t" + href)
    }
  }
  links.sort()

  const guideCode = htmlTags(pages.get("guide/getting-started/index.html")).filter(
    (tag) => tag.name === "pre"
  )
  if (guideCode.length === 0 || guideCode.some((tag) => attribute(tag.raw, "tabindex") !== "0")) {
    throw new Error(name + " getting-started code blocks must be focusable.")
  }
  const apiTables = htmlTags(pages.get("guide/api/index.html")).filter(
    (tag) => tag.name === "table"
  )
  if (apiTables.length === 0 || apiTables.some((tag) => attribute(tag.raw, "tabindex") !== "0")) {
    throw new Error(name + " API tables must be focusable.")
  }

  const compatibilityHtml = pages.get("evidence/compatibility/index.html")
  const renderedFences = [...compatibilityHtml.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/giu)].map(
    (match) => ({
      start: match.index,
      open: "<pre" + match[1] + ">",
      body: match[2],
      full: match[0],
      text: decodeHtml(match[2].replace(/<[^<>]*>/gu, "")),
    })
  )
  if (renderedFences.length !== expectedFences.length) {
    throw new Error(
      name + " compatibility page has " + renderedFences.length + " code blocks; expected four."
    )
  }

  const fenceReports = expectedFences.map((fence, index) => {
    const output = renderedFences[index]
    if (output.text !== fence.code && output.text !== fence.displayCode) {
      throw new Error(name + " changed source text in " + fence.title + ".")
    }
    if (attribute(output.open, "tabindex") !== "0") {
      throw new Error(name + " code block " + fence.title + " is not keyboard-focusable.")
    }
    const snippet = compatibilityHtml.slice(
      Math.max(0, output.start - 500),
      output.start + output.full.length
    )
    const decodedSnippet = decodeHtml(snippet)
    const visibleTitleMetadata = decodedSnippet.includes(fence.title)
    if (strictNativeMetadata && !visibleTitleMetadata) {
      throw new Error(name + " does not preserve visible/title metadata for " + fence.title + ".")
    }
    const labelAttribute = htmlTags(snippet).some(
      (tag) => attribute(tag.raw, "data-label") === fence.label
    )
    const labelInLegacyMeta = decodedSnippet.includes("[" + fence.label + "]")
    const languageMetadata = labelAttribute || labelInLegacyMeta
    if (strictNativeMetadata && !languageMetadata) {
      throw new Error(name + " does not preserve language metadata for " + fence.title + ".")
    }
    const lineTags = [...output.body.matchAll(/<([a-z][a-z0-9:-]*)\b[^<>]*>/giu)]
      .map((match) => match[0])
      .filter((tag) => attribute(tag, "data-ln") !== undefined)
    const lineNumbers = lineTags.map((tag) => Number(attribute(tag, "data-ln")))
    const highlightedLines = lineTags
      .filter((tag) => (attribute(tag, "class") || "").split(/\s+/u).includes("highlighted"))
      .map((tag) => Number(attribute(tag, "data-ln")))
      .sort((left, right) => left - right)
    const sourceLineCount = fence.displayCode.split(/\r?\n/u).length
    const expectedLineNumbers = fence.showLineNumbers
      ? Array.from({ length: sourceLineCount }, (_, line) => line + 1)
      : []
    const uniqueLineNumbers = [...new Set(lineNumbers)].sort((left, right) => left - right)
    const missingLineNumbers = expectedLineNumbers.filter(
      (line) => !uniqueLineNumbers.includes(line)
    )
    const unexpectedLineNumbers = uniqueLineNumbers.filter(
      (line) => !expectedLineNumbers.includes(line)
    )
    const lineNumberStatus = !fence.showLineNumbers
      ? "not-requested"
      : uniqueLineNumbers.length === 0
        ? "unsupported"
        : missingLineNumbers.length > 0
          ? "partial"
          : "present"
    if (!strictNativeMetadata && lineNumberStatus === "partial") {
      throw new Error(name + " has partial line-number metadata for " + fence.title + ".")
    }
    const expectedHighlights = [...new Set(fence.highlightLines)].sort(
      (left, right) => left - right
    )
    const actualHighlights = [...new Set(highlightedLines)].sort((left, right) => left - right)
    const missingHighlights = expectedHighlights.filter((line) => !actualHighlights.includes(line))
    const highlightStatus =
      expectedHighlights.length === 0
        ? "not-requested"
        : actualHighlights.length === 0
          ? "unsupported"
          : missingHighlights.length > 0
            ? "partial"
            : "present"
    if (!strictNativeMetadata && highlightStatus === "partial") {
      throw new Error(name + " has partial highlighted-line metadata for " + fence.title + ".")
    }
    if (strictNativeMetadata) {
      if (lineNumberStatus === "unsupported" || lineNumberStatus === "partial") {
        throw new Error(
          name + " is missing requested line-number metadata for " + fence.title + "."
        )
      }
      if (
        unexpectedLineNumbers.length > 1 ||
        unexpectedLineNumbers.some((line) => line !== sourceLineCount + 1)
      ) {
        throw new Error(name + " has unexpected line numbers for " + fence.title + ".")
      }
      if (highlightStatus === "unsupported" || highlightStatus === "partial") {
        throw new Error(name + " is missing requested highlighted lines for " + fence.title + ".")
      }
      if (JSON.stringify(actualHighlights) !== JSON.stringify(expectedHighlights)) {
        throw new Error(name + " changed highlighted-line metadata for " + fence.title + ".")
      }
    }
    const normalizedOutputText = output.text.replace(/(?:\r?\n)+$/u, "")
    const normalizedSourceText = fence.code.replace(/(?:\r?\n)+$/u, "")
    if (normalizedOutputText !== normalizedSourceText) {
      throw new Error(name + " changed source text in " + fence.title + ".")
    }
    const trailingLineBreaks = output.text.match(/(?:\r?\n)+$/u)?.[0].match(/\r?\n/gu).length ?? 0
    if (
      fence.label === "fallback" &&
      (/\bclass=["'][^"']*\bshiki\b/iu.test(output.open) ||
        /<span\b[^>]*\bstyle=/iu.test(output.body))
    ) {
      throw new Error(name + " unknown-language fallback must stay unstyled.")
    }
    return {
      sourceTextMatches: true,
      outputTextSha256: digest(output.text),
      normalizedOutputTextSha256: digest(normalizedOutputText),
      trailingLineBreaks,
      visibleTitleMetadata,
      languageMetadata,
      focusable: true,
      lineNumberStatus,
      highlightStatus,
      missingLineNumbers,
      unexpectedLineNumbers,
      missingHighlights,
      emittedLineNumbers: uniqueLineNumbers,
      emittedHighlightedLines: actualHighlights,
      outputMetadataFormat: output.open.includes("data-code-title=")
        ? "native-pre-attributes"
        : "legacy-wrapper-or-metastring",
    }
  })

  return {
    links,
    fences: fenceReports,
    compatibilityHtmlSha256: digest(compatibilityHtml),
  }
}

function compareLinks(baselineLinks, candidateLinks) {
  const count = (links) => {
    const counts = new Map()
    for (const link of links) counts.set(link, (counts.get(link) || 0) + 1)
    return counts
  }
  const baselineCounts = count(baselineLinks)
  const candidateCounts = count(candidateLinks)
  const references = [...new Set([...baselineCounts.keys(), ...candidateCounts.keys()])].sort()
  const baselineOnlyReferences = references.filter(
    (reference) => baselineCounts.has(reference) && !candidateCounts.has(reference)
  )
  const candidateOnlyReferences = references.filter(
    (reference) => candidateCounts.has(reference) && !baselineCounts.has(reference)
  )
  const occurrenceDifferences = references
    .filter((reference) => baselineCounts.get(reference) !== candidateCounts.get(reference))
    .map((reference) => ({
      reference,
      baseline: baselineCounts.get(reference) || 0,
      candidate: candidateCounts.get(reference) || 0,
    }))
  return {
    baselineOnlyReferences,
    candidateOnlyReferences,
    occurrenceDifferences,
    exactOccurrenceParity: occurrenceDifferences.length === 0,
    exactTargetParity: baselineOnlyReferences.length === 0 && candidateOnlyReferences.length === 0,
  }
}

function parseFences(markdown) {
  const pattern = /^\x60{3}([^\s\x60]+)([^\n]*)\n([\s\S]*?)^\x60{3}\s*$/gmu
  return [...markdown.matchAll(pattern)].map((match) => {
    const info = match[1] + match[2]
    const title = /title="([^"]+)"/u.exec(info)?.[1]
    const label = /\[([^\]]+)\]/u.exec(info)?.[1]
    const highlightMatch = /\{([\d,-]+)\}/u.exec(info)
    const highlightLines = highlightMatch
      ? highlightMatch[1].split(",").flatMap((part) => {
          if (part.includes("-")) {
            const [first, last] = part.split("-").map(Number)
            return Array.from({ length: last - first + 1 }, (_, index) => first + index)
          }
          return [Number(part)]
        })
      : []
    if (!title || !label)
      throw new Error("A compatibility fence is missing title or label metadata.")
    return {
      title,
      language: match[1],
      label,
      highlightLines,
      showLineNumbers: info.includes("showLineNumbers"),
      code: match[3],
      displayCode: match[3].replace(/\r?\n$/u, ""),
    }
  })
}

function htmlTags(html) {
  return [...html.matchAll(/<([a-z][a-z0-9:-]*)\b[^<>]*>/giu)].map((match) => ({
    name: match[1].toLowerCase(),
    raw: match[0],
  }))
}

function attribute(tag, name) {
  const wanted = name.toLowerCase()
  for (const match of tag.matchAll(
    /(?:^|\s)([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu
  )) {
    if (match[1].toLowerCase() === wanted) return match[2] ?? match[3] ?? match[4]
  }
}

function decodeHtml(value) {
  return value
    .replaceAll(/&amp;/giu, "&")
    .replaceAll(/&quot;/giu, '"')
    .replaceAll(/&#39;|&apos;/giu, "'")
    .replaceAll(/&lt;/giu, "<")
    .replaceAll(/&gt;/giu, ">")
    .replaceAll(/&#(\d+);?/gu, (_, digits) => String.fromCodePoint(Number(digits)))
    .replaceAll(/&#x([\da-f]+);?/giu, (_, digits) =>
      String.fromCodePoint(Number.parseInt(digits, 16))
    )
}

async function fileDigest(filename) {
  try {
    return digest(await readFile(filename))
  } catch {
    return null
  }
}
