import fs from "node:fs/promises"
import path from "node:path"
import { readPackageUp } from "read-package-up"
import { Application, TSConfigReader, TypeDocReader } from "typedoc"

import type { GeneratedApiDoc, TypeDocConfig } from "./types"

import {
  getTypedocOptions,
  type ResolvedTypeDocConfig,
  resolveTypeDocConfig,
  type TypeDocRuntimeContext,
} from "./generator-config"
import { generateMarkdownDocs } from "./generator-docs"

export class TypeDocGenerator {
  private readonly basePath: string
  private readonly config: ResolvedTypeDocConfig
  private readonly packageNameCache = new Map<string, string | undefined>()

  constructor(config: TypeDocConfig) {
    this.config = resolveTypeDocConfig(config)
    this.basePath = `/${this.config.out}`
  }

  async generate(outputDir: string): Promise<GeneratedApiDoc[]> {
    await this.populatePackageNameCache()

    const app = await Application.bootstrapWithPlugins(getTypedocOptions(this.config), [
      new TSConfigReader(),
      new TypeDocReader(),
    ])

    const project = await app.convert()
    if (project == null) {
      throw new Error("TypeDoc conversion failed")
    }

    const context: TypeDocRuntimeContext = {
      basePath: this.basePath,
      config: this.config,
      packageNameCache: this.packageNameCache,
      project,
    }

    const docs = generateMarkdownDocs(context)
    await this.writeDocs(outputDir, docs)
    return docs
  }

  private async populatePackageNameCache(): Promise<void> {
    for (const entryPoint of this.config.entryPoints) {
      await this.resolvePackageName(entryPoint)
    }
  }

  private async resolvePackageName(filePath: string): Promise<string | undefined> {
    const directory = path.dirname(path.resolve(filePath))

    if (this.packageNameCache.has(directory)) {
      return this.packageNameCache.get(directory)
    }

    const packageResult = await readPackageUp({ cwd: directory })
    const packageName = packageResult?.packageJson.name
    const resolvedName =
      packageName == null || packageName.length === 0
        ? undefined
        : packageName.replace(/^@[^/]+\//u, "")

    this.packageNameCache.set(directory, resolvedName)
    return resolvedName
  }

  private async writeDocs(outputDir: string, docs: GeneratedApiDoc[]): Promise<void> {
    const apiDirectory = path.join(outputDir, this.config.out)
    await fs.mkdir(apiDirectory, { recursive: true })

    for (const doc of docs) {
      await this.writeSingleDoc(apiDirectory, doc)
    }
  }

  private async writeSingleDoc(apiDirectory: string, doc: GeneratedApiDoc): Promise<void> {
    const filePath = path.join(apiDirectory, doc.path)
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    const frontmatter = createFrontmatter(doc)
    await fs.writeFile(filePath, `${frontmatter}${doc.content}`)
  }
}

function createFrontmatter(doc: GeneratedApiDoc): string {
  const lines: string[] = ["---", `title: ${doc.frontmatter.title}`]

  if (doc.frontmatter.description != null && doc.frontmatter.description.length > 0) {
    lines.push(`description: ${doc.frontmatter.description}`)
  }

  if (doc.frontmatter.sidebar_position != null) {
    lines.push(`sidebar_position: ${doc.frontmatter.sidebar_position}`)
  }

  if (doc.frontmatter.sidebar === false) {
    lines.push("sidebar: false")
  }

  lines.push("---", "")
  return `${lines.join("\n")}\n`
}

export async function generateApiDocs(
  config: TypeDocConfig,
  outputDir: string
): Promise<GeneratedApiDoc[]> {
  const generator = new TypeDocGenerator(config)
  return generator.generate(outputDir)
}
