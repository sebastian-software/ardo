import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { parse as parseYaml } from "yaml"

/**
 * Agent Skills publication (Agent Skills Discovery RFC v0.2.0): every single-file skill folder
 * `skills/<name>/SKILL.md` is served at `/.well-known/agent-skills/<name>/SKILL.md`, and an index
 * at `/.well-known/agent-skills/index.json` lists them with their SHA-256 digests.
 *
 * Only single-file skills are published for now. A folder with other files is skipped.
 */

export const AGENT_SKILLS_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"
export const AGENT_SKILLS_PATH = "/.well-known/agent-skills"
export const AGENT_SKILLS_INDEX_PATH = `${AGENT_SKILLS_PATH}/index.json`

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const NAME_MAX = 64
const DESCRIPTION_MAX = 1024

export type AgentSkillEntry = {
  name: string
  type: "skill-md"
  description: string
  /** Origin-root path of the published SKILL.md. */
  url: string
  digest: string
}

type SkillPublication = {
  entry: AgentSkillEntry
  file: { fileName: string; source: string }
}

export type AgentSkillsPublication = {
  /** One entry per valid skill, in folder-name order. */
  skills: AgentSkillEntry[]
  /** Files relative to the output root: each SKILL.md, plus the index when skills exist. */
  files: Array<{ fileName: string; source: string }>
  /** One message per skipped folder, each naming the folder and the rule it broke. */
  warnings: string[]
}

/**
 * Reads the skills folder. Returns `undefined` when the folder does not exist, so a project
 * without skills gets nothing and no warning.
 */
export function publishAgentSkills(skillsDir: string): AgentSkillsPublication | undefined {
  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) return undefined

  const skills: AgentSkillEntry[] = []
  const files: AgentSkillsPublication["files"] = []
  const warnings: string[] = []
  for (const entry of listSkillEntries(skillsDir)) {
    const result = publishSkillEntry(path.join(skillsDir, entry.name), entry)
    if (result === undefined) continue
    if (typeof result === "string") {
      warnings.push(`skills/${entry.name}: skipped, ${result}`)
      continue
    }
    skills.push(result.entry)
    files.push(result.file)
  }

  const index = skills.length > 0 ? [indexFile(skills)] : []
  return { skills, files: [...index, ...files], warnings }
}

function indexFile(skills: AgentSkillEntry[]): { fileName: string; source: string } {
  const index = { $schema: AGENT_SKILLS_SCHEMA, skills }
  return {
    fileName: toOutputName(AGENT_SKILLS_INDEX_PATH),
    source: `${JSON.stringify(index, null, 2)}\n`,
  }
}

/** Folders in name order, hidden entries left out. */
function listSkillEntries(skillsDir: string): fs.Dirent[] {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

/** Undefined for plain files, which are not skills; a string when a folder is skipped. */
function publishSkillEntry(dir: string, entry: fs.Dirent): SkillPublication | string | undefined {
  if (entry.isSymbolicLink()) return "symbolic links are not published"
  if (!entry.isDirectory()) return undefined
  return publishSkillFolder(dir, entry.name)
}

/** The skill entry and its file, or the reason the folder is skipped. */
function publishSkillFolder(dir: string, folder: string): SkillPublication | string {
  const children = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((child) => !child.name.startsWith("."))
  const skillFile = children.find((child) => child.name === "SKILL.md")
  if (skillFile === undefined) return "no SKILL.md"
  if (!skillFile.isFile()) return "SKILL.md must be a regular file"

  const extra = children
    .filter((child) => child.name !== "SKILL.md")
    .map((child) => child.name)
    .sort()
  if (extra.length > 0) {
    return `multi-file skills are not published yet (also contains ${extra.join(", ")})`
  }

  const bytes = fs.readFileSync(path.join(dir, "SKILL.md"))
  const source = bytes.toString("utf8")
  if (!Buffer.from(source, "utf8").equals(bytes)) return "SKILL.md is not valid UTF-8"

  const valid = validateFrontmatter(folder, parseFrontmatter(source))
  if (typeof valid === "string") return valid

  const url = `${AGENT_SKILLS_PATH}/${folder}/SKILL.md`
  return {
    entry: {
      name: valid.name,
      type: "skill-md",
      description: valid.description,
      url,
      digest: sha256(bytes),
    },
    file: { fileName: toOutputName(url), source },
  }
}

/** The parsed frontmatter mapping, or the reason there is none. */
function parseFrontmatter(source: string): Record<string, unknown> | string {
  const match = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/u.exec(source)
  if (match === null) return "SKILL.md has no YAML frontmatter"

  let data: unknown
  try {
    data = parseYaml(match[1] ?? "")
  } catch (error) {
    const reason = (error instanceof Error ? error.message : String(error)).split("\n")[0]
    return `SKILL.md frontmatter is not valid YAML: ${(reason ?? "").replace(/:$/u, "")}`
  }
  return data !== null && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : "SKILL.md frontmatter is not a YAML mapping"
}

/** YAML reads `2024` or `true` as scalars; the Agent Skills rules treat them as text. */
function scalar(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return undefined
}

function validateFrontmatter(
  folder: string,
  data: Record<string, unknown> | string
): { name: string; description: string } | string {
  if (typeof data === "string") return data

  if (data.name === undefined || data.name === null) return "frontmatter is missing `name`"
  const name = scalar(data.name)
  if (name === undefined) return "`name` must be a string"
  if ([...name].length > NAME_MAX || !NAME_PATTERN.test(name)) {
    return `\`name\` must be 1-64 lowercase letters, digits and single hyphens, got ${JSON.stringify(name)}`
  }
  if (name !== folder) return `\`name\` ${JSON.stringify(name)} must match the folder name`

  if (data.description === undefined || data.description === null) {
    return "frontmatter is missing `description`"
  }
  const description = scalar(data.description)
  if (description === undefined) return "`description` must be a string"
  if (description.trim() === "") return "frontmatter is missing `description`"
  if ([...description].length > DESCRIPTION_MAX) {
    return `\`description\` must be at most ${DESCRIPTION_MAX} characters`
  }

  return { name, description }
}

function sha256(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`
}

/** Output names are relative to the output root, with no leading slash. */
function toOutputName(publicPath: string): string {
  return publicPath.replace(/^\/+/u, "")
}
