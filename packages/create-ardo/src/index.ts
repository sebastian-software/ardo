import { blue, cyan, dim, green, red, reset, yellow } from "kolorist"
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import prompts from "prompts"

import { type CreateArdoArgs, parseCreateArdoArgs } from "./cli-options"
import { getPackageManagerCommands } from "./package-manager"
import {
  createProjectStructure,
  detectProjectDescription,
  emptyDir,
  getCliVersion,
  isArdoProject,
  isEmpty,
  isValidTemplate,
  templates,
  upgradeProject,
} from "./scaffold"
import { formatTargetDir, normalizeTargetDir, toPackageName, validateTargetDir } from "./target-dir"

const defaultTargetDir = "my-docs"

const onCancel = () => {
  throw new Error(`${red("✖")} Operation cancelled`)
}

type NewProjectPromptResponse = {
  overwrite?: "ignore" | "no" | "yes"
  template?: string
  siteTitle?: string
  docType?: "general" | "library"
  githubPages?: boolean
}

type MainContext = {
  cwd: string
  env: NodeJS.ProcessEnv
  stdinIsTTY: boolean
}

type NewProjectResponse = {
  overwrite?: "ignore" | "no" | "yes"
  template: string
  siteTitle: string
  docType: "general" | "library"
  githubPages: boolean
}

type NewProjectFlowInput = {
  cwd: string
  nonInteractive: boolean
  options: CreateArdoArgs
  root: string
  targetDir: string
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

async function runUpgradeFlow(root: string, options: CreateArdoArgs): Promise<void> {
  const cliVersion = getCliVersion()
  const commands = getPackageManagerCommands(options.packageManager)
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
  console.log(`  ${blue(commands.install)}\n`)
}

function getNewProjectPrompts(targetDir: string, root: string, options: CreateArdoArgs) {
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
      type:
        options.template !== undefined && isValidTemplate(options.template)
          ? null
          : ("select" as const),
      name: "template",
      message: reset("Select a template:"),
      choices: templates.map((t) => ({
        title: `${t.display} ${yellow(`- ${t.description}`)}`,
        value: t.name,
      })),
    },
    {
      type: options.siteTitle === undefined ? ("text" as const) : null,
      name: "siteTitle",
      message: reset("Site title:"),
      initial: options.siteTitle ?? "My Documentation",
    },
    {
      type: options.docType === undefined ? ("select" as const) : null,
      name: "docType",
      message: reset("What are you documenting?"),
      choices: [
        { title: `Code library ${dim("- includes TypeDoc API generation")}`, value: "library" },
        { title: `General documentation ${dim("- guides, manuals, etc.")}`, value: "general" },
      ],
    },
    {
      type: options.githubPages === undefined ? ("select" as const) : null,
      name: "githubPages",
      message: reset("Deploy to GitHub Pages?"),
      choices: [
        { title: `Yes ${dim("- auto-detects base path from git remote")}`, value: true },
        { title: `No ${dim("- deploy to other platforms (Netlify, Vercel, etc.)")}`, value: false },
      ],
    },
  ]
}

async function runNewProjectFlow(input: NewProjectFlowInput): Promise<void> {
  const { cwd, nonInteractive, options, root, targetDir } = input
  const defaultResponse = getDefaultProjectResponse(options)
  if (nonInteractive) {
    validateNonInteractiveProject(root, options)
  }

  const questions = nonInteractive ? [] : getNewProjectPrompts(targetDir, root, options)
  const responseData: unknown = nonInteractive ? {} : await prompts(questions, { onCancel })
  const response = mergeProjectResponse(defaultResponse, readNewProjectPromptResponse(responseData))

  const template = response.template
  if (!isValidTemplate(template)) {
    throw new Error(`${red("✖")} Unknown template "${template}"`)
  }

  ensureProjectDirectory(root, response)

  console.log(`\n  ${cyan("Scaffolding project in")} ${root}...\n`)
  createProjectStructure(root, template, createScaffoldOptions(input, response))
  printNextSteps({ cwd, options, root, targetDir })
}

function ensureProjectDirectory(root: string, response: NewProjectResponse): void {
  if (response.overwrite === "yes") {
    emptyDir(root)
    return
  }

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }
}

function createScaffoldOptions(input: NewProjectFlowInput, response: NewProjectResponse) {
  return {
    siteTitle: response.siteTitle,
    projectName: toPackageName(input.targetDir, input.root),
    typedoc: response.docType === "library",
    githubPages: response.githubPages,
    description: detectProjectDescription(input.root) ?? "Built with Ardo",
    overwriteExisting: response.overwrite !== "ignore",
    packageManager: input.options.packageManager,
  }
}

function printNextSteps({
  cwd,
  options,
  root,
  targetDir,
}: Pick<NewProjectFlowInput, "cwd" | "options" | "root" | "targetDir">): void {
  const commands = getPackageManagerCommands(options.packageManager)
  console.log(`  ${green("Done!")} Now run:\n`)
  if (root !== cwd) console.log(`  ${blue("cd")} ${targetDir}`)
  console.log(`  ${blue(commands.install)}`)
  console.log(`  ${blue(commands.dev)}\n`)
}

function readNewProjectPromptResponse(data: unknown): NewProjectPromptResponse {
  if (!isRecord(data)) {
    return {}
  }

  return {
    docType: data.docType === "library" || data.docType === "general" ? data.docType : undefined,
    githubPages: typeof data.githubPages === "boolean" ? data.githubPages : undefined,
    overwrite: readOverwrite(data.overwrite),
    siteTitle: typeof data.siteTitle === "string" ? data.siteTitle : undefined,
    template: typeof data.template === "string" ? data.template : undefined,
  }
}

function readOverwrite(value: unknown): NewProjectPromptResponse["overwrite"] {
  return value === "ignore" || value === "no" || value === "yes" ? value : undefined
}

function getDefaultProjectResponse(options: CreateArdoArgs): NewProjectResponse {
  return {
    docType: options.docType ?? "general",
    githubPages: options.githubPages ?? true,
    overwrite: undefined,
    siteTitle: options.siteTitle ?? "My Documentation",
    template: options.template ?? "minimal",
  }
}

function mergeProjectResponse(
  defaults: NewProjectResponse,
  overrides: NewProjectPromptResponse
): NewProjectResponse {
  return {
    docType: overrides.docType ?? defaults.docType,
    githubPages: overrides.githubPages ?? defaults.githubPages,
    overwrite: overrides.overwrite ?? defaults.overwrite,
    siteTitle: overrides.siteTitle ?? defaults.siteTitle,
    template: overrides.template ?? defaults.template,
  }
}

function validateNonInteractiveProject(root: string, options: CreateArdoArgs): void {
  if (options.template !== undefined && !isValidTemplate(options.template)) {
    throw new Error(`${red("✖")} Unknown template "${options.template}"`)
  }

  if (fs.existsSync(root) && !isEmpty(root)) {
    throw new Error(
      `${red("✖")} Target directory is not empty. Choose an empty directory or run interactively.`
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object"
}

export async function main(
  args = process.argv.slice(2),
  context: MainContext = {
    cwd: process.cwd(),
    env: process.env,
    stdinIsTTY: process.stdin.isTTY,
  }
) {
  console.log(`\n  ${cyan("◆")} ${green("create-ardo")}\n`)

  const options = parseCreateArdoArgs(args, context.env)
  const nonInteractive = options.yes || !context.stdinIsTTY
  const targetDir = normalizeTargetDir(
    options.targetDir ?? (nonInteractive ? defaultTargetDir : await promptProjectName())
  )
  const root = path.resolve(context.cwd, targetDir)

  if (fs.existsSync(root) && !isEmpty(root) && isArdoProject(root)) {
    await runUpgradeFlow(root, options)
    return
  }

  await runNewProjectFlow({ cwd: context.cwd, nonInteractive, options, root, targetDir })
}

if (isDirectInvocation()) {
  try {
    await main()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(errorMessage)
    process.exit(1)
  }
}

function isDirectInvocation(): boolean {
  const entry = process.argv[1]
  return import.meta.url === pathToFileURL(entry).href
}
