import { blue, cyan, dim, green, red, reset, yellow } from "kolorist"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"

import {
  createProjectStructure,
  detectProjectDescription,
  emptyDir,
  formatTargetDir,
  getCliVersion,
  isArdoProject,
  isEmpty,
  isValidTemplate,
  templates,
  upgradeProject,
} from "./scaffold"

const defaultTargetDir = "my-docs"

const onCancel = () => {
  throw new Error(`${red("✖")} Operation cancelled`)
}

interface NewProjectPromptResponse {
  overwrite?: "ignore" | "no" | "yes"
  template?: string
  siteTitle: string
  docType: "general" | "library"
  githubPages?: boolean
}

async function promptProjectName(): Promise<string> {
  const nameResponse = await prompts<"projectName">(
    {
      type: "text",
      name: "projectName",
      message: reset("Project name:"),
      initial: defaultTargetDir,
      validate: (value: string) => {
        const name = value.trim()
        if (!name) return "Project name is required"
        if (/^[.-]/.test(name)) return "Project name cannot start with a dot or hyphen"
        if (!/^[\da-z-]+$/.test(name))
          return "Project name may only contain lowercase letters, digits, and hyphens"
        return true
      },
    },
    { onCancel }
  )
  const projectName = nameResponse.projectName as string | undefined
  return (
    formatTargetDir(typeof projectName === "string" ? projectName : defaultTargetDir) ??
    defaultTargetDir
  )
}

async function runUpgradeFlow(root: string): Promise<void> {
  const cliVersion = getCliVersion()
  const upgradeResponse = await prompts<"action">(
    {
      type: "select",
      name: "action",
      message: `Existing Ardo project detected. Upgrade to v${cliVersion}?`,
      choices: [
        { title: "Upgrade framework files", value: "upgrade" },
        { title: "Cancel", value: "cancel" },
      ],
    },
    { onCancel }
  )

  if (upgradeResponse.action === "cancel") {
    throw new Error(`${red("✖")} Operation cancelled`)
  }

  console.log(`\n  ${cyan("Upgrading project in")} ${root}...\n`)
  const result = upgradeProject(root)

  for (const file of result.updated) console.log(`  ${green("●")} ${file}`)
  for (const file of result.deleted) console.log(`  ${yellow("●")} ${file} ${dim("(removed)")}`)
  for (const file of result.skipped)
    console.log(`  ${dim("○")} ${file} ${dim("(not found, skipped)")}`)

  console.log(`\n  ${green("Done!")} Now run:\n`)
  console.log(`  ${blue("pnpm install")}\n`)
}

function getNewProjectPrompts(targetDir: string, root: string, argTemplate: string | undefined) {
  return [
    {
      type: (): "select" | null => (!fs.existsSync(root) || isEmpty(root) ? null : "select"),
      name: "overwrite",
      message: () =>
        `${targetDir === "." ? "Current directory" : `Target directory "${targetDir}"`} is not empty. How would you like to proceed?`,
      choices: [
        { title: "Remove existing files and continue", value: "yes" },
        { title: "Cancel operation", value: "no" },
        { title: "Ignore files and continue", value: "ignore" },
      ],
    },
    {
      type: (_: unknown, { overwrite }: { overwrite?: string }) => {
        if (overwrite === "no") throw new Error(`${red("✖")} Operation cancelled`)
        return null
      },
      name: "overwriteChecker",
    },
    {
      type: argTemplate !== undefined && isValidTemplate(argTemplate) ? null : ("select" as const),
      name: "template",
      message: reset("Select a template:"),
      choices: templates.map((t) => ({
        title: `${t.display} ${yellow(`- ${t.description}`)}`,
        value: t.name,
      })),
    },
    {
      type: "text" as const,
      name: "siteTitle",
      message: reset("Site title:"),
      initial: "My Documentation",
    },
    {
      type: "select" as const,
      name: "docType",
      message: reset("What are you documenting?"),
      choices: [
        { title: `Code library ${dim("- includes TypeDoc API generation")}`, value: "library" },
        { title: `General documentation ${dim("- guides, manuals, etc.")}`, value: "general" },
      ],
    },
    {
      type: "select" as const,
      name: "githubPages",
      message: reset("Deploy to GitHub Pages?"),
      choices: [
        { title: `Yes ${dim("- auto-detects base path from git remote")}`, value: true },
        { title: `No ${dim("- deploy to other platforms (Netlify, Vercel, etc.)")}`, value: false },
      ],
    },
  ]
}

async function runNewProjectFlow(
  targetDir: string,
  root: string,
  argTemplate: string | undefined
): Promise<void> {
  const questions = getNewProjectPrompts(targetDir, root, argTemplate)
  const response = (await prompts(questions, { onCancel })) as NewProjectPromptResponse

  const template = response.template ?? argTemplate ?? "minimal"

  if (response.overwrite === "yes") {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  console.log(`\n  ${cyan("Scaffolding project in")} ${root}...\n`)
  createProjectStructure(root, template, {
    siteTitle: response.siteTitle,
    projectName: targetDir,
    typedoc: response.docType === "library",
    githubPages: response.githubPages ?? true,
    description: detectProjectDescription(root) ?? "Built with Ardo",
  })

  console.log(`  ${green("Done!")} Now run:\n`)
  if (root !== process.cwd()) console.log(`  ${blue("cd")} ${targetDir}`)
  console.log(`  ${blue("pnpm install")}`)
  console.log(`  ${blue("pnpm dev")}\n`)
}

async function main() {
  console.log(`\n  ${cyan("◆")} ${green("create-ardo")}\n`)

  const argTargetDir = process.argv.length > 2 ? process.argv[2] : undefined
  const argTemplate = process.argv.length > 3 ? process.argv[3] : undefined
  const targetDir = argTargetDir ?? (await promptProjectName())
  const root = path.join(process.cwd(), targetDir)

  if (fs.existsSync(root) && !isEmpty(root) && isArdoProject(root)) {
    await runUpgradeFlow(root)
    return
  }

  await runNewProjectFlow(targetDir, root, argTemplate)
}

try {
  await main()
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(errorMessage)
  process.exit(1)
}
