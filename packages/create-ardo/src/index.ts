import fs from "node:fs"
import path from "node:path"
import prompts from "prompts"
import { blue, cyan, green, red, reset, yellow, dim } from "kolorist"
import {
  templates,
  createProjectStructure,
  formatTargetDir,
  isEmpty,
  emptyDir,
  isValidTemplate,
  detectProjectDescription,
  isArdoProject,
  upgradeProject,
  getCliVersion,
} from "./scaffold"

const defaultTargetDir = "my-docs"

const onCancel = () => {
  throw new Error(red("✖") + " Operation cancelled")
}

async function main() {
  console.log()
  console.log(`  ${cyan("◆")} ${green("create-ardo")}`)
  console.log()

  const argTargetDir = process.argv[2]
  const argTemplate = process.argv[3]

  let targetDir = argTargetDir || defaultTargetDir

  // Step 1: Get project name (if not provided as CLI arg)
  if (!argTargetDir) {
    const { projectName } = await prompts(
      {
        type: "text",
        name: "projectName",
        message: reset("Project name:"),
        initial: defaultTargetDir,
        validate: (value: string) => {
          const name = value.trim()
          if (!name) return "Project name is required"
          if (/^[.-]/.test(name)) return "Project name cannot start with a dot or hyphen"
          if (!/^[a-z0-9-]+$/.test(name))
            return "Project name may only contain lowercase letters, digits, and hyphens"
          return true
        },
      },
      { onCancel }
    )
    targetDir = formatTargetDir(projectName) || defaultTargetDir
  }

  const root = path.join(process.cwd(), targetDir)

  // Step 2: Check for existing Ardo project → upgrade flow
  if (fs.existsSync(root) && !isEmpty(root) && isArdoProject(root)) {
    const cliVersion = getCliVersion()
    const { action } = await prompts(
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

    if (action === "cancel") {
      throw new Error(red("✖") + " Operation cancelled")
    }

    console.log()
    console.log(`  ${cyan("Upgrading project in")} ${root}...`)
    console.log()

    const result = upgradeProject(root)

    for (const file of result.updated) {
      console.log(`  ${green("●")} ${file}`)
    }
    for (const file of result.deleted) {
      console.log(`  ${yellow("●")} ${file} ${dim("(removed)")}`)
    }
    for (const file of result.skipped) {
      console.log(`  ${dim("○")} ${file} ${dim("(not found, skipped)")}`)
    }

    console.log()
    console.log(`  ${green("Done!")} Now run:`)
    console.log()
    console.log(`  ${blue("pnpm install")}`)
    console.log()
    return
  }

  // Step 3: New project flow
  let template = argTemplate

  const response = await prompts(
    [
      {
        type: () => (!fs.existsSync(root) || isEmpty(root) ? null : "select"),
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
        type: (_, { overwrite }: { overwrite?: string }) => {
          if (overwrite === "no") {
            throw new Error(red("✖") + " Operation cancelled")
          }
          return null
        },
        name: "overwriteChecker",
      },
      {
        type: argTemplate && isValidTemplate(argTemplate) ? null : "select",
        name: "template",
        message: reset("Select a template:"),
        choices: templates.map((t) => ({
          title: `${t.display} ${yellow(`- ${t.description}`)}`,
          value: t.name,
        })),
      },
      {
        type: "text",
        name: "siteTitle",
        message: reset("Site title:"),
        initial: "My Documentation",
      },
      {
        type: "select",
        name: "docType",
        message: reset("What are you documenting?"),
        choices: [
          {
            title: `Code library ${dim("- includes TypeDoc API generation")}`,
            value: "library",
          },
          {
            title: `General documentation ${dim("- guides, manuals, etc.")}`,
            value: "general",
          },
        ],
      },
      {
        type: "select",
        name: "githubPages",
        message: reset("Deploy to GitHub Pages?"),
        choices: [
          {
            title: `Yes ${dim("- auto-detects base path from git remote")}`,
            value: true,
          },
          {
            title: `No ${dim("- deploy to other platforms (Netlify, Vercel, etc.)")}`,
            value: false,
          },
        ],
      },
    ],
    { onCancel }
  )

  const { overwrite, template: templateChoice, siteTitle, docType, githubPages } = response

  template = templateChoice || template || "minimal"

  if (overwrite === "yes") {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  console.log()
  console.log(`  ${cyan("Scaffolding project in")} ${root}...`)
  console.log()

  // Create project structure
  const description = detectProjectDescription(root) || "Built with Ardo"
  createProjectStructure(root, template, {
    siteTitle,
    projectName: targetDir,
    typedoc: docType === "library",
    githubPages: githubPages ?? true,
    description,
  })

  console.log(`  ${green("Done!")} Now run:`)
  console.log()
  if (root !== process.cwd()) {
    console.log(`  ${blue("cd")} ${targetDir}`)
  }
  console.log(`  ${blue("pnpm install")}`)
  console.log(`  ${blue("pnpm dev")}`)
  console.log()
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
