// Command model for ArdoPackageManagers. Kept out of the component module so that
// component files export only components.

/** Package managers shown as tabs, in display order. */
export const ARDO_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const

export type ArdoPackageManager = (typeof ARDO_PACKAGE_MANAGERS)[number]

export type ArdoPackageManagerCommandOptions = {
  /** Space-separated package names. */
  pkg: string
  /** Install as a development dependency. Only applies to `add`. */
  dev?: boolean
  /** `add` installs the packages. `exec` runs them once with the manager's package runner. */
  type?: "add" | "exec"
  /** Extra arguments appended to the end of the command. */
  args?: string
}

const addCommands: Record<ArdoPackageManager, string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
  bun: "bun add",
}

const devFlags: Record<ArdoPackageManager, string> = {
  npm: "-D",
  pnpm: "-D",
  yarn: "-D",
  bun: "-d",
}

const execCommands: Record<ArdoPackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx",
}

/**
 * Builds the command for one package manager, such as `pnpm add -D ardo`.
 *
 * `pkg` and `args` are inserted as written, with runs of whitespace collapsed.
 * Returns an empty string when `pkg` has no package names.
 */
export function getPackageManagerCommand(
  manager: ArdoPackageManager,
  { pkg, dev = false, type = "add", args }: ArdoPackageManagerCommandOptions
): string {
  const packages = normalizeWhitespace(pkg)
  if (packages === "") return ""

  const isDev = dev && type === "add"
  const prefix = type === "exec" ? execCommands[manager] : addCommands[manager]
  const flag = isDev ? devFlags[manager] : ""
  const extra = args == null ? "" : normalizeWhitespace(args)

  return [prefix, flag, packages, extra].filter((part) => part !== "").join(" ")
}

function normalizeWhitespace(value: string): string {
  return value.trim().split(/\s+/u).filter(Boolean).join(" ")
}
