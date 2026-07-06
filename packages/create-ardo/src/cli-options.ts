import {
  isPackageManager,
  type PackageManager,
  packageManagers,
  resolvePackageManager,
} from "./package-manager"

export type DocType = "general" | "library"

export type CreateArdoArgs = {
  docType?: DocType
  githubPages?: boolean
  packageManager: PackageManager
  siteTitle?: string
  targetDir?: string
  template?: string
  yes: boolean
}

type ParserState = {
  options: CreateArdoArgs
  positionals: string[]
}

const flagHandlers = new Map<string, (options: CreateArdoArgs) => void>([
  [
    "--github-pages",
    (options) => {
      options.githubPages = true
    },
  ],
  [
    "--no-github-pages",
    (options) => {
      options.githubPages = false
    },
  ],
  [
    "--no-typedoc",
    (options) => {
      options.docType = "general"
    },
  ],
  [
    "--typedoc",
    (options) => {
      options.docType = "library"
    },
  ],
  [
    "--yes",
    (options) => {
      options.yes = true
    },
  ],
  [
    "-y",
    (options) => {
      options.yes = true
    },
  ],
])

export function parseCreateArdoArgs(
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env
): CreateArdoArgs {
  const state: ParserState = {
    options: {
      packageManager: resolvePackageManager(env),
      yes: false,
    },
    positionals: [],
  }

  for (let index = 0; index < args.length; ) {
    index = parseToken(args, index, state)
  }

  if (state.positionals.length > 2) {
    throw new Error("Expected at most two positional arguments: <target-dir> [template]")
  }

  const [targetDir, template] = state.positionals
  state.options.targetDir = targetDir
  state.options.template = template

  return state.options
}

function parseToken(args: readonly string[], index: number, state: ParserState): number {
  const arg = args[index]
  if (arg === "--") {
    return parseRemainingPositionals(args, index, state)
  }

  const flagIndex = parseKnownFlag(arg, index, state)
  if (flagIndex !== undefined) return flagIndex

  const valueFlagIndex = parseValueFlag(args, index, state)
  if (valueFlagIndex !== undefined) return valueFlagIndex

  parsePositional(arg, state)
  return index + 1
}

function parseRemainingPositionals(
  args: readonly string[],
  index: number,
  state: ParserState
): number {
  state.positionals.push(...args.slice(index + 1))
  return args.length
}

function parseKnownFlag(arg: string, index: number, state: ParserState): number | undefined {
  const flagHandler = flagHandlers.get(arg)
  if (flagHandler === undefined) {
    return undefined
  }

  flagHandler(state.options)
  return index + 1
}

function parseValueFlag(
  args: readonly string[],
  index: number,
  state: ParserState
): number | undefined {
  const arg = args[index]
  if (arg === "--title" || arg.startsWith("--title=")) {
    state.options.siteTitle = readFlagValue(args, arg, index)
    return arg === "--title" ? index + 2 : index + 1
  }

  if (arg === "--package-manager" || arg.startsWith("--package-manager=")) {
    state.options.packageManager = readPackageManager(args, arg, index)
    return arg === "--package-manager" ? index + 2 : index + 1
  }

  return undefined
}

function parsePositional(arg: string, state: ParserState): void {
  if (arg.startsWith("-")) {
    throw new Error(`Unknown option "${arg}"`)
  }

  state.positionals.push(arg)
}

function readPackageManager(args: readonly string[], arg: string, index: number): PackageManager {
  const packageManager = readFlagValue(args, arg, index)
  if (!isPackageManager(packageManager)) {
    throw new Error(
      `Unsupported package manager "${packageManager}". Expected one of: ${packageManagers.join(", ")}`
    )
  }
  return packageManager
}

function readFlagValue(args: readonly string[], arg: string, index: number): string {
  const equalsIndex = arg.indexOf("=")
  if (equalsIndex !== -1) {
    const inlineValue = arg.slice(equalsIndex + 1)
    if (inlineValue === "") {
      throw new Error(`Missing value for ${arg.slice(0, equalsIndex)}`)
    }
    return inlineValue
  }

  if (index + 1 >= args.length) {
    throw new Error(`Missing value for ${arg}`)
  }

  const nextValue = args[index + 1]
  if (nextValue.startsWith("-")) {
    throw new Error(`Missing value for ${arg}`)
  }
  return nextValue
}
