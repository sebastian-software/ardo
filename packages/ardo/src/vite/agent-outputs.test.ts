import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resolveConfig } from "../config"
import { createAgentOutputs } from "./agent-outputs"

// These tests cover Agent Skills alone, so discovery is off; agent-discovery.test.ts covers it.
const skillsOnly = { agentDiscovery: false } as const

let project: string

beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "ardo-agent-outputs-"))
})

afterEach(() => {
  fs.rmSync(project, { recursive: true, force: true })
})

function writeFile(relative: string, body: string) {
  const target = path.join(project, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, body)
}

const skill = "---\nname: ardo\ndescription: Set up Ardo documentation sites.\n---\n# Ardo\n"

describe("createAgentOutputs for Agent Skills", () => {
  it("publishes skills from the configured directory, resolved against the docs project root", () => {
    writeFile("repo/skills/ardo/SKILL.md", skill)
    const docsRoot = path.join(project, "repo", "docs")
    fs.mkdirSync(docsRoot, { recursive: true })
    const config = resolveConfig(
      { title: "Docs", seo: { agentDiscovery: false, agentSkills: { directory: "../skills" } } },
      docsRoot
    )

    const outputs = createAgentOutputs([], config)

    expect(outputs).toStrictEqual({
      assets: [
        expect.objectContaining({ fileName: ".well-known/agent-skills/index.json" }),
        { fileName: ".well-known/agent-skills/ardo/SKILL.md", source: skill },
      ],
      warnings: [],
      notices: [],
    })
  })

  it("uses the skills folder at the project root by default", () => {
    writeFile("skills/ardo/SKILL.md", skill)

    const outputs = createAgentOutputs(
      [],
      resolveConfig({ title: "Docs", seo: skillsOnly }, project)
    )

    expect(outputs.assets.map((asset) => asset.fileName)).toContain(
      ".well-known/agent-skills/ardo/SKILL.md"
    )
  })

  it("publishes nothing, silently, when there is no skills folder", () => {
    expect(
      createAgentOutputs([], resolveConfig({ title: "Docs", seo: skillsOnly }, project))
    ).toStrictEqual({ assets: [], warnings: [], notices: [] })
  })

  it("publishes nothing when agentSkills is false, even with a skills folder", () => {
    writeFile("skills/ardo/SKILL.md", skill)

    const outputs = createAgentOutputs(
      [],
      resolveConfig({ title: "Docs", seo: { ...skillsOnly, agentSkills: false } }, project)
    )

    expect(outputs).toStrictEqual({ assets: [], warnings: [], notices: [] })
  })

  it("skips a deployment base with one info line when skills are configured explicitly", () => {
    writeFile("skills/ardo/SKILL.md", skill)

    const outputs = createAgentOutputs(
      [],
      resolveConfig(
        { title: "Docs", base: "/docs/", seo: { ...skillsOnly, agentSkills: {} } },
        project
      )
    )

    expect(outputs.assets).toStrictEqual([])
    expect(outputs.warnings).toStrictEqual([])
    expect(outputs.notices).toStrictEqual([
      "[ardo] Agent Skills are served from the origin root; skipping skills for base /docs/.",
    ])
  })

  it("skips a deployment base silently with the default settings, even with a skills folder", () => {
    writeFile("skills/ardo/SKILL.md", skill)

    const outputs = createAgentOutputs(
      [],
      resolveConfig({ title: "Docs", base: "/docs/", seo: skillsOnly }, project)
    )

    expect(outputs).toStrictEqual({ assets: [], warnings: [], notices: [] })
  })

  it("reports skipped skill folders as warnings from the build", () => {
    writeFile("skills/ardo/SKILL.md", skill)
    writeFile("skills/ardo/scripts/run.sh", "#!/bin/sh\n")

    const outputs = createAgentOutputs(
      [],
      resolveConfig({ title: "Docs", seo: skillsOnly }, project)
    )

    expect(outputs.assets).toStrictEqual([])
    expect(outputs.warnings).toStrictEqual([
      "skills/ardo: skipped, multi-file skills are not published yet (also contains scripts)",
    ])
  })

  it("rejects an empty skills directory in the config", () => {
    expect(() =>
      resolveConfig({ title: "Docs", seo: { agentSkills: { directory: " " } } }, project)
    ).toThrow("seo.agentSkills.directory must be a non-empty folder path.")
  })
})
