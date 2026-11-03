import { describe, expect, it } from "vitest"

import { lintPage } from "./page-lint"

// Frontmatter that satisfies every rule except the ones under test. The body starts on line 4.
const described = "---\ndescription: A page.\n---\n"

/** Rule ids and lines only, so assertions read as the rule outcome. */
function summarize(source: string) {
  return lintPage(source).map((finding) => [finding.rule, finding.line])
}

describe("missing-description", () => {
  it("reports a page without a description at the frontmatter", () => {
    expect(lintPage("---\ntitle: Setup\n---\n# Setup\n")).toContainEqual({
      line: 1,
      message: "Add a description to the frontmatter.",
      rule: "missing-description",
    })
  })

  it("reports a blank description and a page without frontmatter", () => {
    expect(summarize('---\ndescription: "  "\n---\n')).toStrictEqual([["missing-description", 1]])
    expect(summarize("# Setup\n")).toStrictEqual([["missing-description", 1]])
  })

  it("accepts a page with a description", () => {
    expect(summarize(`${described}## Setup\n`)).toStrictEqual([])
  })
})

describe("multiple-h1", () => {
  it("counts the frontmatter title as the page H1", () => {
    expect(
      summarize("---\ntitle: Setup\ndescription: x\n---\n\n# Other heading\n\nText.\n")
    ).toStrictEqual([["multiple-h1", 6]])
  })

  it("does not count the body H1 that Ardo omits because it repeats the title", () => {
    expect(
      summarize("---\ntitle: Setup\ndescription: x\n---\n\n# Setup {#setup}\n\n## Install\n")
    ).toStrictEqual([])
  })

  it("matches the omitted heading when it is HTML-escaped or carries link markup", () => {
    expect(
      summarize(
        "---\ntitle: Layout & Navigation\ndescription: x\n---\n\n# Layout &amp; Navigation\n"
      )
    ).toStrictEqual([])
    expect(
      summarize("---\ntitle: Setup\ndescription: x\n---\n\n# [Setup](/setup)\n")
    ).toStrictEqual([])
  })

  it("reports a second H1 without a title, at that second heading", () => {
    expect(summarize(`${described}# One\n\nText\n\n# Two\n`)).toStrictEqual([["multiple-h1", 8]])
    expect(summarize(`${described}# One\n`)).toStrictEqual([])
  })

  it("ignores H1 text inside code fences", () => {
    expect(
      summarize("---\ntitle: Setup\ndescription: x\n---\n\n```md\n# Not a heading\n```\n")
    ).toStrictEqual([])
  })
})

describe("heading-skip", () => {
  it("reports a jump from H2 to H4 at the deeper heading", () => {
    expect(summarize(`${described}## Install\n\n#### Details\n`)).toStrictEqual([
      ["heading-skip", 6],
    ])
  })

  it("accepts steps of one level, including the rendered title as H1", () => {
    expect(
      summarize("---\ntitle: Setup\ndescription: x\n---\n\n## Install\n\n### Options\n")
    ).toStrictEqual([])
  })

  it("reports the skip against the preceding heading", () => {
    expect(summarize(`${described}# A\n## B\n##### D\n`)).toStrictEqual([["heading-skip", 6]])
  })

  it("does not flag the first heading when there is no title", () => {
    expect(summarize(`${described}### Deep start\n\n#### Next\n`)).toStrictEqual([])
  })

  it("does not read headings inside code fences", () => {
    expect(
      summarize(`${described}## Install\n\n~~~text\n#### Not a heading\n~~~\n\n### Next\n`)
    ).toStrictEqual([])
  })

  it("reads an ATX heading closed with hashes and ignores a hash without a space", () => {
    expect(summarize(`${described}## Install ##\n\n#Tag\n`)).toStrictEqual([])
    expect(summarize(`${described}## Install ##\n\n##### Deep ##\n`)).toStrictEqual([
      ["heading-skip", 6],
    ])
  })
})

describe("code-language", () => {
  it("reports a fence without a language, at the opening fence", () => {
    expect(lintPage(`${described}\`\`\`\nnpm install\n\`\`\`\n`)).toContainEqual({
      column: 1,
      line: 4,
      message: "Code block has no language. Name it after the opening fence, such as ```ts.",
      rule: "code-language",
    })
  })

  it("accepts a language followed by info-string attributes", () => {
    expect(
      summarize(`${described}\`\`\`ts title="config.ts"\nconst a = 1\n\`\`\`\n`)
    ).toStrictEqual([])
  })

  it("requires the closing fence to use the same character and at least the same length", () => {
    expect(summarize(`${described}\`\`\`\`\nplain\n\`\`\`\nstill code\n\`\`\`\`\n`)).toStrictEqual([
      ["code-language", 4],
    ])
  })

  it("treats an unclosed fence as running to the end of the page", () => {
    expect(summarize(`${described}~~~\nplain\n## Heading\n`)).toStrictEqual([["code-language", 4]])
  })

  it("does not treat a backtick line with backticks in its info string as a fence", () => {
    expect(summarize(`${described}\`\`\` inline \`\`\` text\n`)).toStrictEqual([])
  })
})

describe("shell-prompt", () => {
  it.each(["bash", "sh", "shell", "zsh", "Bash"])(
    "reports a $ prompt in a %s block at column 1",
    (language) => {
      expect(
        lintPage(`${described}\`\`\`${language}\n$ npm install\nnpm run dev\n\`\`\`\n`)
      ).toContainEqual(expect.objectContaining({ column: 1, line: 5, rule: "shell-prompt" }))
    }
  )

  it("ignores a $ prompt in other languages and a $ without a following space", () => {
    expect(summarize(`${described}\`\`\`text\n$ npm install\n\`\`\`\n`)).toStrictEqual([])
    expect(summarize(`${described}\`\`\`bash\n$HOME/bin\n\`\`\`\n`)).toStrictEqual([])
  })

  it("reports each prompt line", () => {
    expect(summarize(`${described}\`\`\`sh\n$ one\n$ two\n\`\`\`\n`)).toStrictEqual([
      ["shell-prompt", 5],
      ["shell-prompt", 6],
    ])
  })
})

describe("per-page disable", () => {
  it("turns every rule off with lint: false", () => {
    expect(lintPage("---\nlint: false\n---\n# One\n\n# Two\n\n```\n$ x\n```\n")).toStrictEqual([])
  })

  it("turns off only the named rules", () => {
    const source =
      "---\nlint:\n  disable:\n    - missing-description\n    - multiple-h1\n---\n# One\n\n# Two\n\n```bash\n$ x\n```\n"
    expect(summarize(source)).toStrictEqual([["shell-prompt", 12]])
  })

  it("keeps rules on when the lint setting is not a valid shape", () => {
    expect(summarize("---\nlint:\n  disable: [nonsense]\n---\n# One\n")).toContainEqual([
      "missing-description",
      1,
    ])
  })
})

describe("unreadable frontmatter", () => {
  it("yields no lint findings, leaving the report to ardo check", () => {
    expect(lintPage("---\ntitle: [unclosed\n---\n# One\n")).toStrictEqual([])
  })
})

describe("line numbers", () => {
  it("counts lines in a file with CRLF line endings", () => {
    expect(summarize(`${described.replaceAll("\n", "\r\n")}## A\r\n\r\n#### B\r\n`)).toStrictEqual([
      ["heading-skip", 6],
    ])
  })
})
