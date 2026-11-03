import fs from "node:fs"
import path from "node:path"

import type { ResolvedConfig } from "../config/types"

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
 * Agent Skills files for one build. They live at the origin root, so with a deployment base
 * they are skipped, and the reason is logged once.
 */
export function createAgentOutputs(config: ResolvedConfig): AgentOutputs {
  const skillsConfig = config.seo.agentSkills
  if (skillsConfig === false) return { assets: [], warnings: [], notices: [] }

  const directory = skillsConfig?.directory ?? DEFAULT_AGENT_SKILLS_DIRECTORY
  const skillsDir = path.resolve(config.root, directory)
  if (config.deploymentBase !== "/") {
    // Only an explicit `agentSkills` setting gets a notice; the default skips silently.
    const notice = `[ardo] Agent Skills are served from the origin root; skipping ${directory} for base ${config.deploymentBase}.`
    const explicit = skillsConfig !== undefined && fs.existsSync(skillsDir)
    return { assets: [], warnings: [], notices: explicit ? [notice] : [] }
  }

  const skills = publishAgentSkills(skillsDir)
  return { assets: skills?.files ?? [], warnings: skills?.warnings ?? [], notices: [] }
}
