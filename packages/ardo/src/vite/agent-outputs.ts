import fs from "node:fs"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"
import type { RouteManifestEntry } from "./route-manifest"

import { AGENT_DISCOVERY_FILE_NAMES, createAgentDiscoveryManifest } from "./agent-discovery"
import { publishAgentSkills } from "./agent-skills"

export const DEFAULT_AGENT_SKILLS_DIRECTORY = "skills"

export type AgentOutputs = {
  /** Files relative to the output root. */
  assets: Array<{ fileName: string; source: string }>
  /** Skill folders that were skipped. The build reports them as warnings. */
  warnings: string[]
  /** Features skipped for a reason the author can fix. The build logs them as info lines. */
  notices: string[]
}

/**
 * Agent Skills and agent discovery files for one build. Both live at the origin root, so with a
 * deployment base they are skipped, and the reason is logged once.
 */
export function createAgentOutputs(
  entries: RouteManifestEntry[],
  config: ResolvedConfig
): AgentOutputs {
  const skills = createSkillOutputs(config)
  const discovery = createDiscoveryOutputs(entries, config, skills.indexPublished)
  return {
    assets: [...skills.assets, ...discovery.assets],
    warnings: skills.warnings,
    notices: [...skills.notices, ...discovery.notices],
  }
}

type SkillOutputs = AgentOutputs & { indexPublished: boolean }

function createSkillOutputs(config: ResolvedConfig): SkillOutputs {
  const empty: SkillOutputs = { assets: [], warnings: [], notices: [], indexPublished: false }
  const skillsConfig = config.seo.agentSkills
  if (skillsConfig === false) return empty

  const directory = skillsConfig?.directory ?? DEFAULT_AGENT_SKILLS_DIRECTORY
  const skillsDir = path.resolve(config.root, directory)
  if (config.deploymentBase !== "/") {
    // Only an explicit `agentSkills` setting gets a notice; the default skips silently.
    const notice = `[ardo] Agent Skills are served from the origin root; skipping ${directory} for base ${config.deploymentBase}.`
    const explicit = skillsConfig !== undefined && fs.existsSync(skillsDir)
    return { ...empty, notices: explicit ? [notice] : [] }
  }

  const skills = publishAgentSkills(skillsDir)
  return {
    assets: skills?.files ?? [],
    warnings: skills?.warnings ?? [],
    notices: [],
    indexPublished: (skills?.skills.length ?? 0) > 0,
  }
}

function createDiscoveryOutputs(
  entries: RouteManifestEntry[],
  config: ResolvedConfig,
  skillsIndexPublished: boolean
): AgentOutputs {
  if (config.agentDiscoveryUrl === undefined) {
    return { assets: [], warnings: [], notices: discoverySkipNotices(config) }
  }

  const manifest = createAgentDiscoveryManifest(entries, config, { skillsIndexPublished })
  const source = `${JSON.stringify(manifest, null, 2)}\n`
  return {
    assets: AGENT_DISCOVERY_FILE_NAMES.map((fileName) => ({ fileName, source })),
    warnings: [],
    notices: [],
  }
}

function discoverySkipNotices(config: ResolvedConfig): string[] {
  // Discovery is on by default, so its skips stay silent unless the author opted in.
  if (config.seo.agentDiscovery !== true) return []
  if (config.siteUrl === "") {
    return [
      "[ardo] Agent discovery files need siteUrl; skipping /.well-known/ard.json and /.well-known/ai-catalog.json.",
    ]
  }
  if (config.deploymentBase !== "/") {
    return [
      `[ardo] Agent discovery files are served from the origin root; skipping them for base ${config.deploymentBase}.`,
    ]
  }
  return []
}
