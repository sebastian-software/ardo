import assert from "node:assert/strict"

const contenderPatterns = [
  /^node(?:@?\d+(?:\.\d+)*)?$/u,
  /^bun(?:x)?$/u,
  /^(?:rustc|cargo)$/u,
  /^(?:clang|clang\+\+)(?:-\d+(?:\.\d+)*)?$/u,
  /^cc1(?:plus)?$/u,
  /^(?:ld|ld\.lld|lld|lld-link)$/u,
  /^pnpm(?:\.cjs)?$/u,
  /^(?:vite|esbuild|rolldown)(?:\.m?js)?$/u,
  /^python(?:\d+(?:\.\d+)*)?$/u,
  /^(?:google chrome|chrome|chromium)(?: helper(?: \([^)]+\))?)?$/u,
  /^(?:firefox|firefox-esr)(?: content process| socket process)?$/u,
  /^webkit(?:webcontent|networkprocess|gpuprocess|storageprocess)$/u,
]

export function isCompetingExecutable(command) {
  const basename = command.trim().split("/").at(-1).toLowerCase()
  return contenderPatterns.some((pattern) => pattern.test(basename))
}

export const guardMatcherSelfTest = [
  { command: "/usr/libexec/triald", expected: false },
  { command: "/opt/homebrew/bin/node", expected: true },
  { command: "/usr/bin/ld", expected: true },
  { command: "/usr/bin/clang++-19", expected: true },
  { command: "/usr/bin/python3.13", expected: true },
  { command: "Google Chrome Helper (Renderer)", expected: true },
  { command: "Chromium Helper (GPU)", expected: true },
  { command: "WebKitWebContent", expected: true },
]

export function assertGuardMatcher() {
  for (const { command, expected } of guardMatcherSelfTest) {
    assert.equal(
      isCompetingExecutable(command),
      expected,
      `Heavy-process guard matcher misclassified ${command}.`
    )
  }
}
