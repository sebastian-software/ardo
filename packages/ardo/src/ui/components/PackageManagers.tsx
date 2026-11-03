import { ArdoCodeBlock, ArdoCodeGroup } from "./CodeBlock"
import { ARDO_PACKAGE_MANAGERS, getPackageManagerCommand } from "./package-manager-commands"

export type ArdoPackageManagersProps = {
  /** Package name, or several names separated by spaces. */
  pkg: string
  /** Install as a development dependency. Only applies to `add`. */
  dev?: boolean
  /** `add` installs the packages (default). `exec` runs them once with the package runner. */
  type?: "add" | "exec"
  /** Extra arguments appended to the end of the command. */
  args?: string
}

/**
 * Installs or runs a package with each supported package manager, shown as tabs.
 *
 * Each tab is an `ArdoCodeGroup` entry, so the copy button and tab behavior match code groups.
 * The commands render as plain text. Build-time highlighting only reaches literal code in Markdown
 * fences and in TSX source, and these commands are computed from props at render time.
 *
 * @example
 * ```mdx
 * <PackageManagers pkg="ardo" />
 * <PackageManagers pkg="typescript" dev />
 * <PackageManagers pkg="create-ardo" type="exec" />
 * ```
 */
export function ArdoPackageManagers(props: ArdoPackageManagersProps) {
  const commands = ARDO_PACKAGE_MANAGERS.map((manager) => ({
    manager,
    command: getPackageManagerCommand(manager, props),
  })).filter((entry) => entry.command !== "")

  if (commands.length === 0) return null

  return (
    <ArdoCodeGroup>
      {commands.map(({ manager, command }) => (
        <ArdoCodeBlock key={manager} data-label={manager} language="bash" code={command} />
      ))}
    </ArdoCodeGroup>
  )
}
