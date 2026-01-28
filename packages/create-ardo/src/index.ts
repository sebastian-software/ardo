import fs from 'node:fs'
import path from 'node:path'
import prompts from 'prompts'
import { blue, cyan, green, red, reset, yellow } from 'kolorist'

const templates = [
  {
    name: 'minimal',
    display: 'Minimal',
    description: 'Basic setup with essential files only',
  },
]

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
    ],
    {
      onCancel: () => {
        throw new Error(red('✖') + ' Operation cancelled')
      },
    }
  )

  const { overwrite, template: templateChoice, siteTitle } = response

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
  createProjectStructure(root, template, siteTitle, targetDir)

  console.log(`  ${green('Done!')} Now run:`)
  console.log()
  if (root !== process.cwd()) {
    console.log(`  ${blue('cd')} ${targetDir}`)
  }
  console.log(`  ${blue('pnpm install')}`)
  console.log(`  ${blue('pnpm dev')}`)
  console.log()
}

function createProjectStructure(
  root: string,
  _template: string,
  siteTitle: string,
  projectName: string
) {
  // package.json
  const pkg = {
    name: projectName,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      ardo: '^1.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      typescript: '^5.7.0',
      vite: '^6.0.0',
    },
  }

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowImportingTsExtensions: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      jsx: 'react-jsx',
    },
    include: ['src/**/*', '*.ts', '*.config.ts'],
    exclude: ['node_modules', 'dist'],
  }

  fs.writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n')

  // vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import { ardo } from 'ardo/vite'

export default defineConfig({
  // For GitHub Pages subdirectory deployments, uncomment and adjust:
  // base: '/${projectName}/',

  plugins: [
    ardo({
      title: '${siteTitle}',
      description: 'Built with Ardo',

      themeConfig: {
        siteTitle: '${siteTitle}',

        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
        ],

        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
            ],
          },
        ],

        footer: {
          message: 'Built with Ardo',
        },

        search: {
          enabled: true,
        },
      },
    }),
  ],
})
`

  fs.writeFileSync(path.join(root, 'vite.config.ts'), viteConfig)

  // .gitignore
  const gitignore = `node_modules
dist
.DS_Store
*.local
`

  fs.writeFileSync(path.join(root, '.gitignore'), gitignore)

  // .github/workflows/deploy.yml — GitHub Pages deployment
  const workflowsDir = path.join(root, '.github', 'workflows')
  fs.mkdirSync(workflowsDir, { recursive: true })

  const deployWorkflow = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist/client

  deploy:
    environment:
      name: github-pages
      url: \\\${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`

  fs.writeFileSync(path.join(workflowsDir, 'deploy.yml'), deployWorkflow)

  // Create content directory
  const contentDir = path.join(root, 'content')
  const guideDir = path.join(contentDir, 'guide')
  fs.mkdirSync(guideDir, { recursive: true })

  // content/index.md
  const indexMd = `---
title: Welcome
---

# Welcome to ${siteTitle}

This documentation site is built with [Ardo](https://github.com/sebastian-software/ardo).

## Getting Started

Check out the [Getting Started](/guide/getting-started) guide to learn more.
`

  fs.writeFileSync(path.join(contentDir, 'index.md'), indexMd)

  // content/guide/getting-started.md
  const gettingStartedMd = `---
title: Getting Started
---

# Getting Started

Welcome to your new documentation site!

## Development

\`\`\`bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
\`\`\`

## Adding Content

Create \`.md\` or \`.mdx\` files in the \`content/\` directory. They will automatically become pages.

## Configuration

Edit \`vite.config.ts\` to customize your site:

- Navigation links
- Sidebar structure
- Site title and description
- Theme options

## Learn More

- [Ardo Documentation](https://sebastian-software.github.io/ardo/)
- [GitHub Repository](https://github.com/sebastian-software/ardo)
`

  fs.writeFileSync(path.join(guideDir, 'getting-started.md'), gettingStartedMd)
}

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function isEmpty(dirPath: string) {
  const files = fs.readdirSync(dirPath)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.join(dir, file), { recursive: true, force: true })
  }
}

function isValidTemplate(template: string) {
  return templates.some((t) => t.name === template)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
