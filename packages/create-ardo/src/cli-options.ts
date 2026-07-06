export type CliOptions = {
  githubPages?: boolean
  help: boolean
  siteTitle?: string
  targetDir?: string
  template?: string
  typedoc?: boolean
  yes: boolean
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    help: false,
    yes: false,
  }
  const positionals: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--") {
      positionals.push(...argv.slice(index + 1))
      break
    }

    if (arg.startsWith("-")) {
      index += applyOption({ arg, argv, index, options })
    } else {
      positionals.push(arg)
    }
  }

  assignPositionals(options, positionals)
  return options
}

type ApplyOptionInput = {
  arg: string
  argv: string[]
  index: number
  options: CliOptions
}

function applyOption({ arg, argv, index, options }: ApplyOptionInput): number {
  if (arg.startsWith("--title=")) {
    options.siteTitle = arg.slice("--title=".length)
    return 0
  }

  switch (arg) {
    case "--github-pages":
      options.githubPages = true
      return 0
    case "--help":
    case "-h":
      options.help = true
      return 0
    case "--no-github-pages":
      options.githubPages = false
      return 0
    case "--no-typedoc":
      options.typedoc = false
      return 0
    case "--title":
      options.siteTitle = readRequiredValue(argv, index, "--title")
      return 1
    case "--typedoc":
      options.typedoc = true
      return 0
    case "--yes":
    case "-y":
      options.yes = true
      return 0
    default:
      throw new Error(`Unknown option: ${arg}`)
  }
}

function readRequiredValue(argv: string[], index: number, flag: string): string {
  if (index + 1 >= argv.length) {
    throw new Error(`${flag} requires a value`)
  }
  const value = argv[index + 1]
  if (value.startsWith("-")) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

function assignPositionals(options: CliOptions, positionals: string[]): void {
  if (positionals.length > 2) {
    throw new Error(`Unexpected argument: ${positionals[2]}`)
  }

  options.targetDir = positionals[0]
  options.template = positionals[1]
}

export function getHelpText(): string {
  return [
    "Usage:",
    "  create-ardo [target-directory] [template] [options]",
    "",
    "Options:",
    "  -y, --yes                 Use defaults without prompting",
    "      --title <title>       Set the site title",
    "      --typedoc             Enable TypeDoc API pages",
    "      --no-typedoc          Disable TypeDoc API pages",
    "      --github-pages        Enable GitHub Pages config",
    "      --no-github-pages     Disable GitHub Pages config",
    "  -h, --help                Show this help",
  ].join("\n")
}
