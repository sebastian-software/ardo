import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"

export type Recipe = {
  name: string
  description: string
  markdown: string
}

type TextOutput = Pick<NodeJS.WriteStream, "write">
type CommandOutput = { stdout: TextOutput; stderr: TextOutput }

/** Recipes ship in the package root, beside `dist/`, so one path works from source and from the build. */
export const recipesDirectory = fileURLToPath(new URL("../../recipes", import.meta.url))

const addHelp = `Usage: ardo add [recipe]

Without a recipe, lists the available recipes. With a recipe, prints its Markdown to
stdout so you can hand it to a coding agent. The command writes no files.
`

/** Reads every recipe in the directory, sorted by name. Invalid frontmatter fails the read. */
export function listRecipes(directory: string = recipesDirectory): Recipe[] {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => parseRecipe(file, fs.readFileSync(path.join(directory, file), "utf8")))
}

function parseRecipe(file: string, markdown: string): Recipe {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/u.exec(markdown)?.[1]
  const data: unknown = frontmatter == null ? undefined : parseYaml(frontmatter)
  if (
    typeof data !== "object" ||
    data === null ||
    !("name" in data) ||
    !("description" in data) ||
    typeof data.name !== "string" ||
    typeof data.description !== "string"
  ) {
    throw new Error(`Recipe ${file} needs name and description frontmatter.`)
  }
  if (data.name !== path.basename(file, ".md")) {
    throw new Error(`Recipe ${file} must be named after its frontmatter name "${data.name}".`)
  }
  return { name: data.name, description: data.description, markdown }
}

/** Lists recipes or prints one. Reads the package only; it never writes to the project. */
export function runAddCommand(
  args: readonly string[],
  output: CommandOutput,
  directory: string = recipesDirectory
): number {
  if (args[0] === "--help" || args[0] === "-h") {
    output.stdout.write(addHelp)
    return 0
  }
  if (args.length > 1) {
    output.stderr.write(addHelp)
    return 2
  }

  let recipes: Recipe[]
  try {
    recipes = listRecipes(directory)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    output.stderr.write(`Ardo add failed: ${message}\n`)
    return 1
  }

  return args.length === 0
    ? printRecipeList(recipes, output.stdout)
    : printRecipe(String(args[0]), recipes, output)
}

function printRecipeList(recipes: Recipe[], stdout: TextOutput): number {
  const width = Math.max(...recipes.map((entry) => entry.name.length)) + 2
  const lines = recipes.map((entry) => `  ${entry.name.padEnd(width)}${entry.description}\n`)
  stdout.write(
    `Available recipes:\n${lines.join("")}\nPrint one with "ardo add <recipe>" and hand it to your coding agent.\n`
  )
  return 0
}

function printRecipe(name: string, recipes: Recipe[], output: CommandOutput): number {
  const match = recipes.find((entry) => entry.name === name)
  if (match == null) {
    const names = recipes.map((entry) => entry.name).join(", ")
    output.stderr.write(
      `Unknown recipe "${name}". Available recipes: ${names}.\nRun "ardo add" to list them.\n`
    )
    return 2
  }
  output.stdout.write(match.markdown)
  return 0
}
