import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createProjectStructure } from './scaffold'

describe('createProjectStructure', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-ardo-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates all expected files', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test Docs', 'test-project')

    const expectedFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      '.gitignore',
      '.github/workflows/deploy.yml',
      'content/index.md',
      'content/guide/getting-started.md',
      'src/router.tsx',
      'src/vite-env.d.ts',
      'src/routes/__root.tsx',
      'src/routes/index.tsx',
    ]

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(tmpDir, file)), `${file} should exist`).toBe(true)
    }
  })

  it('generates valid package.json with correct fields', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test Docs', 'my-project')

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('my-project')
    expect(pkg.type).toBe('module')
    expect(pkg.private).toBe(true)
    expect(pkg.dependencies.ardo).toBe('^1.0.0')
    expect(pkg.dependencies['@tanstack/react-router']).toBeDefined()
    expect(pkg.dependencies.react).toBeDefined()
    expect(pkg.dependencies['react-dom']).toBeDefined()
    expect(pkg.scripts.dev).toBe('vite')
    expect(pkg.scripts.build).toBe('vite build')
    expect(pkg.devDependencies.typescript).toBeDefined()
    expect(pkg.devDependencies.vite).toBeDefined()
  })

  it('embeds site title in vite.config.ts', () => {
    createProjectStructure(tmpDir, 'minimal', 'My Custom Title', 'test-project')

    const viteConfig = fs.readFileSync(path.join(tmpDir, 'vite.config.ts'), 'utf-8')
    expect(viteConfig).toContain("title: 'My Custom Title'")
    expect(viteConfig).toContain("siteTitle: 'My Custom Title'")
    expect(viteConfig).toContain("import { ardo } from 'ardo/vite'")
  })

  it('includes base path comment in vite.config.ts', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'my-docs')

    const viteConfig = fs.readFileSync(path.join(tmpDir, 'vite.config.ts'), 'utf-8')
    expect(viteConfig).toContain("// base: '/my-docs/'")
  })

  it('generates valid tsconfig.json', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const tsconfig = JSON.parse(fs.readFileSync(path.join(tmpDir, 'tsconfig.json'), 'utf-8'))
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.compilerOptions.module).toBe('ESNext')
  })

  it('generates .gitignore with node_modules and dist', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
    expect(gitignore).toContain('node_modules')
    expect(gitignore).toContain('dist')
  })

  it('generates GitHub Actions deploy workflow', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const workflow = fs.readFileSync(path.join(tmpDir, '.github/workflows/deploy.yml'), 'utf-8')
    expect(workflow).toContain('Deploy to GitHub Pages')
    expect(workflow).toContain('pnpm build')
    expect(workflow).toContain('dist/client')
    expect(workflow).toContain('actions/deploy-pages@v4')
  })

  it('embeds site title in content/index.md', () => {
    createProjectStructure(tmpDir, 'minimal', 'My Docs Site', 'test-project')

    const indexMd = fs.readFileSync(path.join(tmpDir, 'content/index.md'), 'utf-8')
    expect(indexMd).toContain('My Docs Site')
    expect(indexMd).toContain('title: Welcome')
  })

  it('generates router entry with route tree', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const router = fs.readFileSync(path.join(tmpDir, 'src/router.tsx'), 'utf-8')
    expect(router).toContain('createRouter')
    expect(router).toContain("from './routeTree.gen'")
  })

  it('generates vite-env.d.ts with module declarations', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const envDts = fs.readFileSync(path.join(tmpDir, 'src/vite-env.d.ts'), 'utf-8')
    expect(envDts).toContain('virtual:ardo/config')
    expect(envDts).toContain('virtual:ardo/sidebar')
    expect(envDts).toContain("declare module '*.md'")
  })

  it('generates root route with HTML shell', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const rootRoute = fs.readFileSync(path.join(tmpDir, 'src/routes/__root.tsx'), 'utf-8')
    expect(rootRoute).toContain('createRootRoute')
    expect(rootRoute).toContain("import 'ardo/theme/styles.css'")
    expect(rootRoute).toContain('HeadContent')
    expect(rootRoute).toContain('Scripts')
  })

  it('generates index route for home page', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const indexRoute = fs.readFileSync(path.join(tmpDir, 'src/routes/index.tsx'), 'utf-8')
    expect(indexRoute).toContain("createFileRoute('/')")
    expect(indexRoute).toContain('HomePage')
    expect(indexRoute).toContain('PressProvider')
    expect(indexRoute).toContain("from '../../content/index.md'")
  })

  it('creates exactly 2 markdown content files', () => {
    createProjectStructure(tmpDir, 'minimal', 'Test', 'test-project')

    const mdFiles: string[] = []

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(fullPath)
        else if (entry.name.endsWith('.md')) mdFiles.push(fullPath)
      }
    }

    walk(path.join(tmpDir, 'content'))
    expect(mdFiles).toHaveLength(2)
  })
})
