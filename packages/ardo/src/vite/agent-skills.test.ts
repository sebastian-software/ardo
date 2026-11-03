import { createHash } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { publishAgentSkills } from "./agent-skills"

const sha256 = (source: string) =>
  `sha256:${createHash("sha256").update(Buffer.from(source, "utf8")).digest("hex")}`

let root: string
let skillsDir: string

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-agent-skills-"))
  skillsDir = path.join(root, "skills")
  fs.mkdirSync(skillsDir)
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

function writeSkill(folder: string, body: string, file = "SKILL.md") {
  const target = path.join(skillsDir, folder, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, body)
}

const gitWorkflow =
  "---\nname: git-workflow\ndescription: Follow team Git conventions for branching and commits.\n---\n# Git workflow\n"

describe("publishAgentSkills", () => {
  it("publishes each single-file skill and an index with the SHA-256 digest of the published bytes", () => {
    writeSkill("git-workflow", gitWorkflow)
    writeSkill("deploy", "---\nname: deploy\ndescription: Deploy the site.\n---\nRun it.\n")

    const result = publishAgentSkills(skillsDir)!

    expect(result.warnings).toStrictEqual([])
    expect(result.files.map((file) => file.fileName)).toStrictEqual([
      ".well-known/agent-skills/index.json",
      ".well-known/agent-skills/deploy/SKILL.md",
      ".well-known/agent-skills/git-workflow/SKILL.md",
    ])
    const index = JSON.parse(result.files[0]!.source)
    expect(index).toStrictEqual({
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: "deploy",
          type: "skill-md",
          description: "Deploy the site.",
          url: "/.well-known/agent-skills/deploy/SKILL.md",
          digest: sha256("---\nname: deploy\ndescription: Deploy the site.\n---\nRun it.\n"),
        },
        {
          name: "git-workflow",
          type: "skill-md",
          description: "Follow team Git conventions for branching and commits.",
          url: "/.well-known/agent-skills/git-workflow/SKILL.md",
          digest: sha256(gitWorkflow),
        },
      ],
    })
    expect(result.files[0]!.source.endsWith("}\n")).toBe(true)
    for (const skill of index.skills) {
      const file = result.files.find((item) => `/${item.fileName}` === skill.url)!
      expect(sha256(file.source)).toBe(skill.digest)
    }
  })

  it("keeps the published SKILL.md byte-for-byte, byte order mark included", () => {
    const source = "﻿---\nname: bom\ndescription: Starts with a byte order mark.\n---\nBody\n"
    writeSkill("bom", source)

    const result = publishAgentSkills(skillsDir)!

    expect(result.warnings).toStrictEqual([])
    expect(result.files.find((file) => file.fileName.endsWith("bom/SKILL.md"))!.source).toBe(source)
  })

  it("skips invalid skills with a warning that names the folder and the broken rule", () => {
    writeSkill("git-workflow", gitWorkflow)
    writeSkill("Bad-Name", "---\nname: Bad-Name\ndescription: x\n---\n")
    writeSkill("mismatch", "---\nname: other\ndescription: x\n---\n")
    writeSkill("no-frontmatter", "# Just text\n")
    writeSkill("no-description", "---\nname: no-description\n---\n")
    writeSkill("long", `---\nname: long\ndescription: ${"x".repeat(1025)}\n---\n`)
    writeSkill("list", "---\n- not\n- a map\n---\n")
    writeSkill("broken-yaml", "---\nname: broken-yaml\ndescription: [unclosed\n---\n")
    writeSkill("empty-folder", "", "README.md")

    const result = publishAgentSkills(skillsDir)!

    expect(result.skills.map((skill) => skill.name)).toStrictEqual(["git-workflow"])
    expect(result.warnings.find((warning) => warning.includes("broken-yaml"))).toMatch(
      /^skills\/broken-yaml: skipped, SKILL\.md frontmatter is not valid YAML: \S/u
    )
    expect(
      result.warnings.filter((warning) => !warning.includes("broken-yaml")).sort()
    ).toStrictEqual(
      [
        'skills/Bad-Name: skipped, `name` must be 1-64 lowercase letters, digits and single hyphens, got "Bad-Name"',
        "skills/empty-folder: skipped, no SKILL.md",
        "skills/list: skipped, SKILL.md frontmatter is not a YAML mapping",
        "skills/long: skipped, `description` must be at most 1024 characters",
        'skills/mismatch: skipped, `name` "other" must match the folder name',
        "skills/no-description: skipped, frontmatter is missing `description`",
        "skills/no-frontmatter: skipped, SKILL.md has no YAML frontmatter",
      ].sort()
    )
  })

  it("skips a multi-file skill with a warning naming the folder", () => {
    writeSkill("deploy", "---\nname: deploy\ndescription: Deploy the site.\n---\n")
    writeSkill("deploy", "#!/bin/sh\n", "scripts/deploy.sh")
    writeSkill("deploy", "# Commands\n", "references/COMMANDS.md")
    writeSkill("deploy", "noise", ".DS_Store")

    const result = publishAgentSkills(skillsDir)!

    expect(result.skills).toStrictEqual([])
    expect(result.files).toStrictEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toMatch(
      /^skills\/deploy: skipped, multi-file skills are not published yet \(also contains references, scripts\)$/u
    )
  })

  it("publishes nothing and no index when no folder is a valid skill", () => {
    writeSkill("a", "no frontmatter")

    const result = publishAgentSkills(skillsDir)!

    expect(result.skills).toStrictEqual([])
    expect(result.files).toStrictEqual([])
    expect(result.warnings).toStrictEqual(["skills/a: skipped, SKILL.md has no YAML frontmatter"])
  })

  it("returns nothing when the skills folder does not exist", () => {
    expect(publishAgentSkills(path.join(root, "missing"))).toBeUndefined()
  })
})
