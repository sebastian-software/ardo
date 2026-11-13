import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getGitFileTimestamps } from "./git-utils"

let directory: string

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_AUTHOR_NAME: "Test",
  GIT_COMMITTER_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "Test",
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_CONFIG_NOSYSTEM: "1",
}

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: directory, encoding: "utf8", env: gitEnv })
}

function commit(files: Record<string, string>, seconds: number): void {
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true })
    fs.writeFileSync(path.join(directory, name), content)
  }
  git("add", "-A")
  execFileSync("git", ["commit", "-q", "-m", `commit ${seconds}`], {
    cwd: directory,
    env: { ...gitEnv, GIT_AUTHOR_DATE: `@${seconds}`, GIT_COMMITTER_DATE: `@${seconds}` },
  })
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-git-utils-"))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  fs.rmSync(directory, { force: true, recursive: true })
})

describe("getGitFileTimestamps", () => {
  it("dates files whose names Git would quote by their last commit", () => {
    git("init", "-q")
    commit(
      {
        "a b.md": "a",
        "über.md": "b",
        "tab\there.md": "c",
        'quote"d.md': "d",
        "back\\slash.md": "e",
        "guide/start.md": "f",
      },
      1_700_000_000
    )
    commit({ "a b.md": "changed", "guide/start.md": "changed" }, 1_800_000_000)

    expect(Object.fromEntries(getGitFileTimestamps(directory))).toStrictEqual({
      "a b.md": 1_800_000_000_000,
      "back\\slash.md": 1_700_000_000_000,
      "guide/start.md": 1_800_000_000_000,
      'quote"d.md': 1_700_000_000_000,
      "tab\there.md": 1_700_000_000_000,
      "über.md": 1_700_000_000_000,
    })
    expect(Object.fromEntries(getGitFileTimestamps(path.join(directory, "guide")))).toStrictEqual({
      "start.md": 1_800_000_000_000,
    })
  })

  it("stays silent outside a repository and in one without commits", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.stubEnv("GIT_CEILING_DIRECTORIES", path.dirname(directory))
    expect(getGitFileTimestamps(directory).size).toBe(0)
    git("init", "-q")
    fs.writeFileSync(path.join(directory, "page.md"), "page")
    git("add", "-A")
    expect(getGitFileTimestamps(directory).size).toBe(0)
    expect(warn).not.toHaveBeenCalled()
  })

  it("warns once when the history of a repository cannot be read", () => {
    git("init", "-q")
    commit({ "page.md": "page" }, 1_700_000_000)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    // An invalid log date format makes `git log` fail while the repository stays valid.
    vi.stubEnv("GIT_CONFIG_COUNT", "1")
    vi.stubEnv("GIT_CONFIG_KEY_0", "log.date")
    vi.stubEnv("GIT_CONFIG_VALUE_0", "not-a-format")

    expect(getGitFileTimestamps(directory).size).toBe(0)
    expect(getGitFileTimestamps(directory).size).toBe(0)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain("[ardo]")
  })
})
