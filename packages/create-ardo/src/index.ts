import { blue, cyan, dim, green, red, reset, yellow } from "kolorist"
import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"

import { type CliOptions, getHelpText, parseCliArgs } from "./cli-options"
import { detectPackageManager, getPackageManagerCommands } from "./package-manager"
import {
  createProjectStructure,
  derivePackageName,
  detectProjectDescription,
  emptyDir,
  formatTargetDir,
  getCliVersion,
  isArdoProject,
  isEmpty,
  isValidTemplate,
  templates,
  upgradeProject,
  validateTargetDir,
} from "./scaffold"

const defaultTargetDir = "my-docs"

const onCancel = () => {
  throw new Error(`${red("✖")} Operation cancelled`)
}

type NewProjectPromptResponse = {
  overwrite?: "ignore" | "no" | "yes"
  template?: string
  siteTitle: string
  docType: "general" | "library"
  githubPages?: boolean
}

type NewProjectPromptContext = {
  argTemplate: string | undefined
  cliOptions: CliOptions
  root: string
  targetDir: string
}

type NewProjectFlowContext = {
  cliOptions: CliOptions
  nonInteractive: boolean
  root: string
  targetDir: string
}

type NewProjectSettings = {
  githubPages: boolean
  packageManager: ReturnType<typeof detectPackageManager>
  siteTitle: string
  template: string
  typedoc: boolean
}

async function promptProjectName(): Promise<string> {
  const nameResponse = await prompts<"projectName">(
    {
      type: "text",
      name: "projectName",
      message: reset("Project name:"),
      initial: defaultTargetDir,
      validate(value: string) {
        return validateTargetDir(value)
      },
    },
    { onCancel }
  )
  const projectName: unknown = nameResponse.projectName
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

function getNewProjectPrompts(context: NewProjectPromptContext) {
  const { argTemplate, cliOptions, root, targetDir } = context
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
      type(_: unknown, { overwrite }: { overwrite?: string }) {
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
      type: cliOptions.siteTitle === undefined ? ("text" as const) : null,
      name: "siteTitle",
      message: reset("Site title:"),
      initial: "My Documentation",
    },
    {
      type: cliOptions.typedoc === undefined ? ("select" as const) : null,
      name: "docType",
      message: reset("What are you documenting?"),
      choices: [
        { title: `Code library ${dim("- includes TypeDoc API generation")}`, value: "library" },
        { title: `General documentation ${dim("- guides, manuals, etc.")}`, value: "general" },
      ],
    },
    {
      type: cliOptions.githubPages === undefined ? ("select" as const) : null,
      name: "githubPages",
      message: reset("Deploy to GitHub Pages?"),
      choices: [
        { title: `Yes ${dim("- auto-detects base path from git remote")}`, value: true },
        { title: `No ${dim("- deploy to other platforms (Netlify, Vercel, etc.)")}`, value: false },
      ],
    },
  ]
}

async function runNewProjectFlow(context: NewProjectFlowContext): Promise<void> {
  const { cliOptions, nonInteractive, root, targetDir } = context
  const argTemplate = cliOptions.template
  validateNewProjectStart(context, argTemplate)
  const questions = getNewProjectPrompts({ argTemplate, cliOptions, root, targetDir })
  const responseData: unknown = nonInteractive ? {} : await prompts(questions, { onCancel })
  const response = readNewProjectPromptResponse(responseData)
  const settings = resolveNewProjectSettings(cliOptions, response)

  prepareTargetDirectory(root, response)

  console.log(`\n  ${cyan("Scaffolding project in")} ${root}...\n`)
  createProjectStructure(root, settings.template, {
    siteTitle: settings.siteTitle,
    projectName: derivePackageName(targetDir, root),
    typedoc: settings.typedoc,
    githubPages: settings.githubPages,
    description: detectProjectDescription(root) ?? "Built with Ardo",
    packageManager: settings.packageManager,
    overwriteExisting: response.overwrite !== "ignore",
  })

  printNextSteps(targetDir, root, settings.packageManager)
}

function validateNewProjectStart(
  { nonInteractive, root, targetDir }: NewProjectFlowContext,
  argTemplate: string | undefined
): void {
  if (argTemplate !== undefined && !isValidTemplate(argTemplate) && nonInteractive) {
    throw new Error(`${red("✖")} Unknown template: ${argTemplate}`)
  }

  if (nonInteractive && fs.existsSync(root) && !isEmpty(root)) {
    throw new Error(`${red("✖")} Target directory is not empty: ${targetDir}`)
  }
}

function resolveNewProjectSettings(
  cliOptions: CliOptions,
  response: NewProjectPromptResponse
): NewProjectSettings {
  return {
    githubPages: cliOptions.githubPages ?? response.githubPages ?? true,
    packageManager: detectPackageManager(),
    siteTitle: cliOptions.siteTitle ?? response.siteTitle,
    template: response.template ?? cliOptions.template ?? "minimal",
    typedoc: cliOptions.typedoc ?? response.docType === "library",
  }
}

function prepareTargetDirectory(root: string, response: NewProjectPromptResponse): void {
  if (response.overwrite === "yes") {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
}

function printNextSteps(
  targetDir: string,
  root: string,
  packageManager: NewProjectSettings["packageManager"]
): void {
  console.log(`  ${green("Done!")} Now run:\n`)
  if (root !== process.cwd()) console.log(`  ${blue("cd")} ${targetDir}`)
  const commands = getPackageManagerCommands(packageManager)
  console.log(`  ${blue(commands.install)}`)
  console.log(`  ${blue(commands.dev)}\n`)
}

function readNewProjectPromptResponse(data: unknown): NewProjectPromptResponse {
  if (!isRecord(data)) {
    return {
      docType: "general",
      siteTitle: "My Documentation",
    }
  }

  return {
    docType: data.docType === "library" ? "library" : "general",
    githubPages: typeof data.githubPages === "boolean" ? data.githubPages : undefined,
    overwrite: readOverwrite(data.overwrite),
    siteTitle: typeof data.siteTitle === "string" ? data.siteTitle : "My Documentation",
    template: typeof data.template === "string" ? data.template : undefined,
  }
}

function readOverwrite(value: unknown): NewProjectPromptResponse["overwrite"] {
  return value === "ignore" || value === "no" || value === "yes" ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

async function main() {
  const cliOptions = parseCliArgs(process.argv.slice(2))
  if (cliOptions.help) {
    console.log(getHelpText())
    return
  }

  console.log(`\n  ${cyan("◆")} ${green("create-ardo")}\n`)

  const nonInteractive = cliOptions.yes || !process.stdin.isTTY
  const targetDir = await resolveTargetDir(cliOptions, nonInteractive)
  const root = path.join(process.cwd(), targetDir)

  if (fs.existsSync(root) && !isEmpty(root) && isArdoProject(root)) {
    await runUpgradeFlow(root)
    return
  }

  await runNewProjectFlow({ cliOptions, nonInteractive, root, targetDir })
}

async function resolveTargetDir(cliOptions: CliOptions, nonInteractive: boolean): Promise<string> {
  const argTargetDir = formatTargetDir(cliOptions.targetDir)
  const targetDir = argTargetDir ?? (nonInteractive ? defaultTargetDir : await promptProjectName())
  const targetDirValidation = validateTargetDir(targetDir)
  if (targetDirValidation !== true) {
    throw new Error(`${red("✖")} ${targetDirValidation}`)
  }
  return targetDir
}

try {
  await main()
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(errorMessage)
  process.exit(1)
}
