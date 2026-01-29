import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'
import { blue, cyan, green, red, reset, yellow, dim } from 'kolorist'
import {
  templates,
  createProjectStructure,
  formatTargetDir,
  isEmpty,
  emptyDir,
  isValidTemplate,
} from './scaffold'

const defaultTargetDir = 'my-docs'

async function main() {
  console.log()
  console.log(`  ${cyan('◆')} ${green('create-ardo')}`)
  console.log()

  const argTargetDir = process.argv[2]
  const argTemplate = process.argv[3]

  let targetDir = argTargetDir || defaultTargetDir
  let template = argTemplate

  const response = await prompts(
    [
      {
        type: argTargetDir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir
        },
      },
      {
        type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'select'),
        name: 'overwrite',
        message: () =>
          `${targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`} is not empty. How would you like to proceed?`,
        choices: [
          { title: 'Remove existing files and continue', value: 'yes' },
          { title: 'Cancel operation', value: 'no' },
          { title: 'Ignore files and continue', value: 'ignore' },
        ],
      },
      {
        type: (_, { overwrite }: { overwrite?: string }) => {
          if (overwrite === 'no') {
            throw new Error(red('✖') + ' Operation cancelled')
          }
          return null
        },
        name: 'overwriteChecker',
      },
      {
        type: argTemplate && isValidTemplate(argTemplate) ? null : 'select',
        name: 'template',
        message: reset('Select a template:'),
        choices: templates.map((t) => ({
          title: `${t.display} ${yellow(`- ${t.description}`)}`,
          value: t.name,
        })),
      },
      {
        type: 'text',
        name: 'siteTitle',
        message: reset('Site title:'),
        initial: 'My Documentation',
      },
      {
        type: 'select',
        name: 'docType',
        message: reset('What are you documenting?'),
        choices: [
          {
            title: `Code library ${dim('- includes TypeDoc API generation')}`,
            value: 'library',
          },
          {
            title: `General documentation ${dim('- guides, manuals, etc.')}`,
            value: 'general',
          },
        ],
      },
      {
        type: 'select',
        name: 'githubPages',
        message: reset('Deploy to GitHub Pages?'),
        choices: [
          {
            title: `Yes ${dim('- auto-detects base path from git remote')}`,
            value: true,
          },
          {
            title: `No ${dim('- deploy to other platforms (Netlify, Vercel, etc.)')}`,
            value: false,
          },
        ],
      },
    ],
    {
      onCancel: () => {
        throw new Error(red('✖') + ' Operation cancelled')
      },
    }
  )

  const { overwrite, template: templateChoice, siteTitle, docType, githubPages } = response

  template = templateChoice || template || 'minimal'
  const root = path.join(process.cwd(), targetDir)

  if (overwrite === 'yes') {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  console.log()
  console.log(`  ${cyan('Scaffolding project in')} ${root}...`)
  console.log()

  // Create project structure
  createProjectStructure(root, template, {
    siteTitle,
    projectName: targetDir,
    typedoc: docType === 'library',
    githubPages: githubPages ?? true,
  })

  console.log(`  ${green('Done!')} Now run:`)
  console.log()
  if (root !== process.cwd()) {
    console.log(`  ${blue('cd')} ${targetDir}`)
  }
  console.log(`  ${blue('pnpm install')}`)
  console.log(`  ${blue('pnpm dev')}`)
  console.log()
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
